/* -----------------------------------------------------------------------------
 * Pluggable HTTP layer for `fetchState`.
 * ---------------------------------------------------------------------------
 * `fetchState` doesn't call `fetch` directly — it calls a `FetchAdapter`. The
 * default adapter wraps `globalThis.fetch`; users can swap it globally with
 * `setFetchStateAdapter(adapter)` or per-call via the `fetcher` config field.
 *
 * The interfaces here are deliberately minimal — only what `fetchState` and
 * its default `parse` need. This keeps third-party HTTP clients easy to
 * adapt: axios returns parsed bodies eagerly, fetch returns a `Response`,
 * but both can satisfy `FetchResponse` with a thin wrapper.
 * ------------------------------------------------------------------------- */

/**
 * Minimal Response-like surface that `fetchState`'s `parse` function
 * consumes. Both the native `fetch` `Response` and a custom adapter (e.g.
 * the axios one in this package) need to expose this shape.
 *
 * @category Async
 */
export interface FetchResponse {
  /** True when `status` is in the 200-299 range. */
  readonly ok: boolean;
  /** HTTP status code. */
  readonly status: number;
  /** Parse body as JSON. Defaults to `unknown` — narrow with `parse`. */
  json(): Promise<unknown>;
  /** Parse body as text. */
  text(): Promise<string>;
}

/**
 * Init forwarded to the adapter. Mirrors `RequestInit` minus the `signal`
 * (the wrapper sets that itself) and minus `window` (only meaningful for
 * `fetch` in some environments).
 *
 * `signal` is added at call time and is always present when the adapter
 * receives the init.
 *
 * @category Async
 */
export interface FetchAdapterInit
  extends Omit<RequestInit, 'signal' | 'window'> {
  readonly signal: AbortSignal;
}

/**
 * Plug your HTTP client in here. Takes a URL and the normalised init, and
 * returns a `FetchResponse`. May reject — `fetchState` catches and routes
 * the error into the failed state.
 *
 * @category Async
 */
export type FetchAdapter = (
  url: string,
  init: FetchAdapterInit
) => Promise<FetchResponse>;

/**
 * Default adapter — wraps `globalThis.fetch`. The native `Response` already
 * matches `FetchResponse` structurally, so this is a one-line passthrough.
 *
 * @category Async
 */
export const defaultFetchAdapter: FetchAdapter = (url, init) =>
  fetch(url, init);

// Process-wide adapter. Starts as the fetch-based default; replaceable
// via `setFetchStateAdapter`.
let activeAdapter: FetchAdapter = defaultFetchAdapter;

/**
 * Replace the global `FetchAdapter` used by every `fetchState` call that
 * doesn't pass its own `fetcher` override. Call once at app boot — e.g.
 * to route every reactive fetch through axios:
 *
 * ```ts
 * import axios from 'axios';
 * import { setFetchStateAdapter, createAxiosFetchAdapter } from '@react-logic/utils';
 *
 * setFetchStateAdapter(createAxiosFetchAdapter(axios));
 * ```
 *
 * @category Async
 * @param adapter - The new global adapter.
 */
export const setFetchStateAdapter = (adapter: FetchAdapter): void => {
  activeAdapter = adapter;
};

/** @internal — used by `fetchState`; not a public API. */
export const getFetchStateAdapter = (): FetchAdapter => activeAdapter;

/* -----------------------------------------------------------------------------
 * Axios adapter
 * ---------------------------------------------------------------------------
 * Axios isn't a hard dependency — users pass their own axios instance in.
 * The minimal interface here is what we structurally need; the real axios
 * type satisfies it.
 * ------------------------------------------------------------------------- */

/** Minimal subset of axios we use. The real `AxiosInstance` satisfies this. */
interface AxiosLikeClient {
  request(config: {
    url: string;
    method?: string;
    headers?: Record<string, string | undefined>;
    data?: unknown;
    signal?: AbortSignal;
    responseType?: 'text';
    transformResponse?: (data: unknown) => unknown;
    validateStatus?: ((status: number) => boolean) | null;
  }): Promise<{
    status: number;
    statusText?: string;
    data: string;
  }>;
}

/**
 * Wrap an axios instance as a `FetchAdapter`. The instance you pass in is
 * the one that will be used — install interceptors, base URLs, auth
 * headers on it before passing.
 *
 * The adapter forces axios into raw-text mode (`responseType: 'text'`,
 * `transformResponse: identity`) so the lazy `json()` / `text()` contract
 * on `FetchResponse` matches the native fetch behaviour. JSON parsing
 * happens in `parse` (or its default), not in the adapter.
 *
 * `validateStatus` is set to `null` so axios doesn't throw on non-2xx —
 * we want to surface the `FetchResponse.ok = false` path the same way
 * `fetch` does. `fetchState`'s default `parse` will then return a non-`ok`
 * response, which the user can branch on in their own `parse`.
 *
 * @category Async
 * @param axios - Your axios instance (e.g. `axios.create({...})` or the
 *   default singleton).
 * @returns A `FetchAdapter` ready to pass to `setFetchStateAdapter` or to
 *   the per-call `fetcher` config.
 */
export const createAxiosFetchAdapter = (
  axios: AxiosLikeClient
): FetchAdapter => {
  return async (url, init) => {
    // Convert HeadersInit to a plain record. Axios doesn't accept Headers
    // or [string, string][] tuples uniformly across versions.
    const headers = normaliseHeaders(init.headers);
    const res = await axios.request({
      url,
      method: init.method ?? 'GET',
      headers,
      data: init.body,
      signal: init.signal,
      responseType: 'text',
      transformResponse: (d) => d,
      // Don't let axios reject on non-2xx — mirror fetch's behaviour of
      // surfacing it via `ok`.
      validateStatus: null,
    });
    const text = res.data;
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      async json() {
        return JSON.parse(text);
      },
      async text() {
        return text;
      },
    };
  };
};

const normaliseHeaders = (
  h: HeadersInit | undefined
): Record<string, string> | undefined => {
  if (!h) return undefined;
  if (h instanceof Headers) {
    const out: Record<string, string> = {};
    h.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  if (Array.isArray(h)) return Object.fromEntries(h);
  return h as Record<string, string>;
};
