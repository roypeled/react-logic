import { signal } from 'alien-signals';
import { effect, REACTIVE_ACCESSOR_MARKER } from '@react-logic/state';
import {
  FetchAdapter,
  FetchResponse,
  getFetchStateAdapter,
} from './fetch-adapter';

/**
 * The value carried by a `fetchState` / `fetchState.callable` signal. A
 * discriminated union with four variants — branch on `idle` / `loading` /
 * `failed`, then read `result` / `error` / `status`.
 *
 * ```ts
 * const s = data();
 * if (s.idle) return <button>Start</button>;          // callable, never fired
 * if (s.loading) return <Spinner />;
 * if (s.failed) return <Error message={s.error.message} status={s.status} />;
 * return <List items={s.result} httpStatus={s.status} />;
 * ```
 *
 * **`idle`** — only emitted by `fetchState.callable` before its first
 * `.fetch(...)`. Reactive `fetchState` skips this state: the build
 * callback fires immediately, so the initial value is `loading`.
 *
 * **`status`** — HTTP status code. Present on success. Present on failed
 * only when the request reached a response (`parse` threw, non-2xx
 * default-parse rejected, etc.). Absent on pure network failures (CORS,
 * DNS, fetch threw before a response existed).
 *
 * @typeParam T - The parsed response type.
 * @category Async
 */
export type FetchStateValue<T> =
  | {
      readonly idle: true;
      readonly loading: false;
      readonly failed: false;
    }
  | {
      readonly idle: false;
      readonly loading: true;
      readonly failed: false;
    }
  | {
      readonly idle: false;
      readonly loading: false;
      readonly failed: false;
      readonly status: number;
      readonly result: T;
    }
  | {
      readonly idle: false;
      readonly loading: false;
      readonly failed: true;
      readonly status?: number;
      readonly error: Error;
    };

const INITIAL_LOADING: FetchStateValue<never> = Object.freeze({
  idle: false,
  loading: true,
  failed: false,
});

const INITIAL_IDLE: FetchStateValue<never> = Object.freeze({
  idle: true,
  loading: false,
  failed: false,
});

/* -----------------------------------------------------------------------------
 * Request shape — shared between `fetchState`'s config and the object that
 * `callableFetchState`'s build callback returns.
 * ------------------------------------------------------------------------- */

/**
 * Request body. Standard `BodyInit` (string, FormData, Blob, etc.) goes
 * through as-is. Plain objects and arrays are JSON-stringified
 * automatically and a `Content-Type: application/json` header is set if
 * one isn't already present.
 *
 * @category Async
 */
export type FetchStateBody = BodyInit | object | null;

/**
 * Common config fields shared by `fetchState` and `callableFetchState`.
 * Mirrors `RequestInit` so `method`, `headers`, `credentials`, etc. land
 * directly on the config object — plus the wrapper-specific `parse` and
 * `fetcher` fields. Plain-object bodies are auto-stringified.
 *
 * @typeParam T - The parsed response type.
 * @category Async
 */
export interface FetchStateConfig<T = unknown>
  extends Omit<RequestInit, 'signal' | 'window' | 'body'> {
  /**
   * Plain objects/arrays are JSON-stringified; `BodyInit` values pass
   * through untouched.
   */
  body?: FetchStateBody;
  /**
   * How to turn the response into the value. Defaults to a function that
   * throws when `!ok` and returns `r.json() as T` otherwise. Throw inside
   * `parse` to land in the failed state with that error and the response's
   * `status`.
   */
  parse?: (response: FetchResponse) => Promise<T>;
  /**
   * Per-call HTTP adapter, overriding the global one set via
   * `setFetchStateAdapter`.
   */
  fetcher?: FetchAdapter;
}

/**
 * The full request descriptor a build callback may return — same as
 * `FetchStateConfig` plus a required `url`. Either both helpers'
 * callbacks return this object, or a bare URL string as a shorthand for
 * `{ url }`.
 *
 * @typeParam T - The parsed response type.
 * @category Async
 */
export interface FetchStateRequest<T = unknown> extends FetchStateConfig<T> {
  url: string;
}

/**
 * What a build callback returns: a URL string (shorthand for a GET), a
 * full request descriptor, or a nullish value to skip this tick (only
 * meaningful inside `fetchState`; `callableFetchState` requires a
 * descriptor since the call was explicit).
 *
 * @category Async
 */
export type FetchStateBuilderResult<T = unknown> =
  | string
  | FetchStateRequest<T>
  | null
  | undefined;

/* -----------------------------------------------------------------------------
 * Internal: shared request execution + body normalisation.
 * ------------------------------------------------------------------------- */

const defaultParse = async <T>(r: FetchResponse): Promise<T> => {
  if (!r.ok) {
    const err = new Error(`HTTP ${r.status}`) as Error & { status: number };
    err.status = r.status;
    throw err;
  }
  return (await r.json()) as T;
};

const isPlainBody = (body: unknown): body is object => {
  if (body == null || typeof body !== 'object') return false;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return false;
  if (typeof Blob !== 'undefined' && body instanceof Blob) return false;
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams)
    return false;
  if (typeof ArrayBuffer !== 'undefined') {
    if (body instanceof ArrayBuffer) return false;
    if (ArrayBuffer.isView(body)) return false;
  }
  if (
    typeof ReadableStream !== 'undefined' &&
    body instanceof ReadableStream
  )
    return false;
  // What's left: plain objects, arrays, anything custom. Treat as JSON.
  return true;
};

const hasContentType = (headers: HeadersInit | undefined): boolean => {
  if (!headers) return false;
  if (headers instanceof Headers) return headers.has('Content-Type');
  if (Array.isArray(headers))
    return headers.some(([k]) => k.toLowerCase() === 'content-type');
  return Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
};

const withJsonHeader = (headers: HeadersInit | undefined): HeadersInit => {
  if (!headers) return { 'Content-Type': 'application/json' };
  if (headers instanceof Headers) {
    const h = new Headers(headers);
    h.set('Content-Type', 'application/json');
    return h;
  }
  if (Array.isArray(headers))
    return [...headers, ['Content-Type', 'application/json']];
  return { ...headers, 'Content-Type': 'application/json' };
};

const headersToRecord = (h: HeadersInit | undefined): Record<string, string> => {
  if (!h) return {};
  if (h instanceof Headers) {
    const out: Record<string, string> = {};
    h.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  if (Array.isArray(h)) return Object.fromEntries(h);
  return { ...(h as Record<string, string>) };
};

/** Deep-merge two HeadersInit values; `override` keys win. */
const mergeHeaders = (
  base: HeadersInit | undefined,
  override: HeadersInit | undefined
): HeadersInit | undefined => {
  if (!base) return override;
  if (!override) return base;
  return { ...headersToRecord(base), ...headersToRecord(override) };
};

/**
 * Take whatever the build callback returned (string / request / nullish)
 * and merge with the static defaults from the second config arg. The
 * per-call values win on conflict; headers deep-merge so a default
 * `Authorization` survives a per-call `Content-Type`.
 */
const resolveRequest = <T>(
  built: FetchStateBuilderResult<T>,
  defaults: FetchStateConfig<T> | undefined
): FetchStateRequest<T> | null => {
  if (!built) return null;
  const perCall: FetchStateRequest<T> =
    typeof built === 'string' ? ({ url: built } as FetchStateRequest<T>) : built;
  if (!defaults) return perCall;
  return {
    ...defaults,
    ...perCall,
    headers: mergeHeaders(defaults.headers, perCall.headers),
  };
};

interface ExecuteContext<T> {
  setLoading: () => void;
  setSuccess: (status: number, result: T) => void;
  setFailed: (error: Error, status: number | undefined) => void;
  fallbackFetcher: FetchAdapter;
}

/**
 * Run one request. Returns the controller so the caller can abort it.
 * The state transitions go through the supplied setters so the caller
 * decides which signal they land on.
 */
const executeRequest = <T>(
  req: FetchStateRequest,
  ctx: ExecuteContext<T>
): AbortController => {
  const controller = new AbortController();
  const { signal: abortSignal } = controller;

  ctx.setLoading();

  // Normalise body: stringify plain objects, set JSON header if absent.
  const { url, body, parse, fetcher, headers, ...rest } = req;
  let normalisedBody: BodyInit | null | undefined = body as
    | BodyInit
    | null
    | undefined;
  let normalisedHeaders = headers;
  if (isPlainBody(body)) {
    normalisedBody = JSON.stringify(body);
    if (!hasContentType(headers)) {
      normalisedHeaders = withJsonHeader(headers);
    }
  }

  const init = {
    ...rest,
    headers: normalisedHeaders,
    body: normalisedBody,
    signal: abortSignal,
  };
  const adapter = fetcher ?? ctx.fallbackFetcher;
  const doParse = parse ?? defaultParse;

  let seenStatus: number | undefined;

  const requestRunner = async () => {
    try {
      const r = await adapter(url, init);
      if (abortSignal.aborted) return;
      seenStatus = r.status;
      const parsed = await doParse(r) as T;
      if (abortSignal.aborted) return;
      ctx.setSuccess(r.status, parsed);
    } catch (e) {
      if (abortSignal.aborted) return;
      const err =
        e instanceof Error
          ? e
          : new Error(typeof e === 'string' ? e : 'Fetch failed');
      if (err.name === 'AbortError') return;
      const carriedStatus = (err as Error & { status?: number }).status;
      ctx.setFailed(err, seenStatus ?? carriedStatus);
    }
  }

  void requestRunner();

  return controller;
};

/* -----------------------------------------------------------------------------
 * Accessor shape — same for both reactive and imperative variants.
 *
 * `()` reads the current `FetchStateValue`.
 * `.fetch(...args)` fires a new request with these args.
 * `.fetch()` re-runs with the current input / last args.
 *
 * For 0-param reactive `fetchState(() => …)`, `.fetch()` is the only form
 * — there are no args to pass.
 * ------------------------------------------------------------------------- */

/**
 * Reactive / imperative fetch accessor. `()` reads the state; `.fetch`
 * either fires a new request with the given args (writing the wrapped
 * input signal for reactive, running the build callback for imperative)
 * or — when called with no args — re-runs the last request.
 *
 * @typeParam T - The parsed response type.
 * @typeParam Args - The build callback's argument tuple. `[]` for the
 *   0-param reactive form.
 * @category Async
 */
export type FetchStateAccessor<T, Args extends readonly unknown[]> =
  (() => FetchStateValue<T>) & {
    /**
     * Fire a request with the given arguments. With no arguments, re-fire
     * the last request — current input for reactive, most recent
     * `.fetch(...)` args for imperative.
     */
    fetch: {
      (...args: Args): void;
      (): void;
    };
    [REACTIVE_ACCESSOR_MARKER]: true;
  };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReactiveReturn<F extends (...args: any) => FetchStateBuilderResult<T>, T> =
  Parameters<F>['length'] extends 0
    ? FetchStateAccessor<T, []>
    : undefined extends Parameters<F>[0]
      ? FetchStateAccessor<T, [Parameters<F>[0]]>
      : never;

/* -----------------------------------------------------------------------------
 * Reactive implementation. Build callback tracks signal reads; `.fetch(v)`
 * writes the wrapped input signal so the effect re-fires.
 * ------------------------------------------------------------------------- */

// Floor defaults applied to every reactive `fetchState` call. Locked to
// GET because reactive POST/PUT/DELETE — firing a mutation whenever a
// signal changes — is almost always a bug. Callers can still override per
// fetchState call (via the config arg) or per build-callback return (via
// the descriptor), but the floor pushes them to think about it first.
const REACTIVE_DEFAULTS: FetchStateConfig<unknown> = { method: 'GET' };

const fetchStateImpl = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  F extends (...args: any) => FetchStateBuilderResult<T>,
  T = unknown,
>(
  build: F,
  config?: FetchStateConfig<T>
): ReactiveReturn<F, T> => {
  const input = signal<unknown>(undefined);
  const value = signal<FetchStateValue<T>>(INITIAL_LOADING);
  const refetchTrigger = signal(0);
  let currentController: AbortController | null = null;

  effect(() => {
    // Subscribe to the refetch trigger so a no-arg `.fetch()` forces a re-run.
    refetchTrigger();

    const built = build(input()) as FetchStateBuilderResult<T>;
    const req = resolveRequest(built, {
      ...REACTIVE_DEFAULTS,
      ...config,
    } as FetchStateConfig<T>);
    if (!req) return;

    currentController?.abort();
    currentController = executeRequest<T>(req, {
      setLoading: () => value(INITIAL_LOADING),
      setSuccess: (status, result) =>
        value({ idle: false, loading: false, failed: false, status, result }),
      setFailed: (error, status) =>
        value(
          status === undefined
            ? { idle: false, loading: false, failed: true, error }
            : { idle: false, loading: false, failed: true, status, error }
        ),
      fallbackFetcher: getFetchStateAdapter(),
    });

    return () => currentController?.abort();
  });

  function accessor(): FetchStateValue<T> {
    return value();
  }

  const finalizedAccessor = accessor as unknown as FetchStateAccessor<
    T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >;

  finalizedAccessor[REACTIVE_ACCESSOR_MARKER] = true;
  finalizedAccessor.fetch = (...args: unknown[]) => {
    if (args.length > 0) {
      // Writing the input retriggers the tracked effect.
      input(args[0]);
    } else {
      // No arg → keep current input, force the effect to re-run.
      refetchTrigger(refetchTrigger() + 1);
    }
  };

  return finalizedAccessor as ReactiveReturn<F, T>;
};

/* -----------------------------------------------------------------------------
 * Imperative implementation — exposed as `fetchState.callable`.
 *
 * Build callback only runs when `.fetch(...)` is called. Signals read
 * inside the build are NOT tracked. Right for mutations and one-off
 * triggers.
 * ------------------------------------------------------------------------- */

const callableImpl = <Args extends readonly unknown[], T = unknown>(
  build: (...args: Args) => string | FetchStateRequest<T>,
  config?: FetchStateConfig<T>
): FetchStateAccessor<T, Args> => {
  // Callable starts idle — nothing has been fired yet. Transitions to
  // loading on first .fetch(...). Reactive `fetchState` skips idle: its
  // build callback fires synchronously at construction, so it goes
  // straight to loading.
  const value = signal<FetchStateValue<T>>(INITIAL_IDLE);
  let controller: AbortController | null = null;
  let lastArgs: Args | null = null;

  const run = (args: Args) => {
    lastArgs = args;
    const req = resolveRequest(build(...args), config);
    if (!req) return;
    controller?.abort();
    controller = executeRequest<T>(req, {
      setLoading: () => value(INITIAL_LOADING),
      setSuccess: (status, result) =>
        value({ idle: false, loading: false, failed: false, status, result }),
      setFailed: (error, status) =>
        value(
          status === undefined
            ? { idle: false, loading: false, failed: true, error }
            : { idle: false, loading: false, failed: true, status, error }
        ),
      fallbackFetcher: getFetchStateAdapter(),
    });
  };

  function accessor(): FetchStateValue<T> {
    return value();
  }

  const finalizedAccessor = accessor as unknown as FetchStateAccessor<T, Args>;
  finalizedAccessor[REACTIVE_ACCESSOR_MARKER] = true;
  finalizedAccessor.fetch = ((...args: unknown[]) => {
    if (args.length > 0) {
      run(args as unknown as Args);
    } else if (lastArgs) {
      run(lastArgs);
    }
    // No-arg fetch before any args = no-op; nothing to fire.
  }) as FetchStateAccessor<T, Args>['fetch'];
  return finalizedAccessor;
};

/* -----------------------------------------------------------------------------
 * Public API — one function with a `.callable` method on it.
 * ------------------------------------------------------------------------- */

/**
 * Reactive fetch with cancellation, a discriminated loading/result/error
 * state, and HTTP status on success/failed.
 *
 * The build callback returns either a URL string (shorthand for a GET) or
 * a full `FetchStateRequest` descriptor. Returning `null` / `undefined` /
 * empty string skips the fetch for that tick. The optional second argument
 * supplies static defaults merged into every request — per-call wins on
 * conflict; headers deep-merge.
 *
 * **Reactive (the default):** the build callback tracks every signal it
 * reads. The fetch re-fires whenever a tracked signal changes.
 *
 * ```ts
 * // No input — depends on outer signals.
 * data = fetchState(() => {
 *   const id = this.userId();
 *   return id ? `/users/${id}` : null;
 * });
 * data();          // → FetchStateValue
 * data.fetch();    // → re-fetch (same URL, current signals)
 *
 * // Input variant — `.fetch(v)` writes the wrapped input signal,
 * // re-triggering the build with the new value.
 * results = fetchState((q = '') => q ? `/search?q=${q}` : null);
 * results.fetch('react');   // sets input, fires
 * results.fetch();          // refetch with current input
 * results();                 // → FetchStateValue
 * ```
 *
 * **Imperative** — see {@link fetchState.callable}. The build callback
 * only runs when you call `.fetch(...)`; no signal tracking. The right
 * shape for mutations and one-off triggers.
 *
 * @typeParam F - The build-callback signature.
 * @typeParam T - The parsed response type.
 * @category Async
 */
export const fetchState: {
  <
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    F extends (...args: any) => FetchStateBuilderResult<T>,
    T = unknown,
  >(
    build: F,
    config?: FetchStateConfig<T>
  ): ReactiveReturn<F, T>;
  /**
   * Imperative companion. The build callback only runs when `.fetch(...)`
   * is called — never reactively. Same accessor shape as the reactive form.
   *
   * ```ts
   * const postComment = fetchState.callable((message: string) => ({
   *   url: '/api/comments',
   *   method: 'POST',
   *   body: { message },     // plain object — auto-stringified
   * }));
   *
   * postComment.fetch('hello world');   // fires the request
   * postComment();                       // reads FetchStateValue
   * postComment.fetch();                 // re-runs with 'hello world'
   * ```
   *
   * Calling `.fetch(...)` again before the previous request resolves
   * aborts the previous in-flight request. A no-arg `.fetch()` before any
   * `.fetch(...args)` is a no-op (no args to fire with).
   *
   * @typeParam Args - The build callback's argument tuple.
   * @typeParam T - The parsed response type.
   */
  callable: <Args extends readonly unknown[], T = unknown>(
    build: (...args: Args) => string | FetchStateRequest<T>,
    config?: FetchStateConfig<T>
  ) => FetchStateAccessor<T, Args>;
} = Object.assign(fetchStateImpl, { callable: callableImpl });

/* -----------------------------------------------------------------------------
 * Method-preset helpers — sugar over `fetchState` with the HTTP method
 * baked into the defaults. Each helper preserves the full `fetchState`
 * surface: the helper itself is reactive (build callback tracks signals);
 * `.callable` is the imperative companion. Method propagates to both.
 *
 * The build callback's per-call descriptor can still override the method
 * (it wins over the helper's preset), so e.g. reactive `postFetchState`
 * with a callback that returns `{ method: 'PATCH', … }` will PATCH. The
 * helper's name just sets what the verb is *by default*.
 *
 * Reactive POST/PUT/DELETE may sound strange, but it's exactly right for
 * GraphQL: every query is a POST under the hood, even when it's
 * semantically a read that should re-fire on key change.
 * ------------------------------------------------------------------------- */

/** Shape of a verb-preset helper — same as `fetchState`. */
export interface FetchStateMethodPreset {
  <
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    F extends (...args: any) => FetchStateBuilderResult<T>,
    T = unknown,
  >(
    build: F,
    config?: FetchStateConfig<T>
  ): ReactiveReturn<F, T>;
  callable: <Args extends readonly unknown[], T = unknown>(
    build: (...args: Args) => string | FetchStateRequest<T>,
    config?: FetchStateConfig<T>
  ) => FetchStateAccessor<T, Args>;
}

const methodPreset = (
  method: 'POST' | 'PUT' | 'DELETE'
): FetchStateMethodPreset => {
  const reactive = <
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    F extends (...args: any) => FetchStateBuilderResult<T>,
    T = unknown,
  >(
    build: F,
    config?: FetchStateConfig<T>
  ): ReactiveReturn<F, T> =>
    fetchState<F, T>(build, { method, ...config });

  const callable = <Args extends readonly unknown[], T = unknown>(
    build: (...args: Args) => string | FetchStateRequest<T>,
    config?: FetchStateConfig<T>
  ): FetchStateAccessor<T, Args> =>
    fetchState.callable<Args, T>(build, { method, ...config });

  return Object.assign(reactive, { callable }) as FetchStateMethodPreset;
};

/**
 * POST-flavoured `fetchState`. Reactive by default (tracks the build
 * callback's signal reads); `.callable` is the imperative companion.
 *
 * ```ts
 * // Reactive — e.g. a GraphQL query that re-fires when its input changes.
 * const profile = postFetchState((id = '') => ({
 *   url: '/graphql',
 *   body: { query: USER_QUERY, variables: { id } },
 * }));
 *
 * // Imperative — typical mutation.
 * const submit = postFetchState.callable((message: string) => ({
 *   url: '/api/comments',
 *   body: { message },
 * }));
 * submit.fetch('hello world');
 * ```
 *
 * @category Async
 */
export const postFetchState = methodPreset('POST');

/**
 * PUT-flavoured `fetchState`. Reactive by default; `.callable` for the
 * imperative variant.
 *
 * @category Async
 */
export const putFetchState = methodPreset('PUT');

/**
 * DELETE-flavoured `fetchState`. Reactive by default; `.callable` for the
 * imperative variant.
 *
 * @category Async
 */
export const deleteFetchState = methodPreset('DELETE');
