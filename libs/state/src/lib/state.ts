import {
  computed,
  effect as rawEffect,
  endBatch,
  signal,
  startBatch,
} from 'alien-signals';
import { onDestroy } from '@react-logic/di';

/**
 * Coalesce multiple signal writes into a single notification pass. Inside
 * the callback, subscribers (effects, `useLogic` re-renders) don't fire on
 * each individual write — they fire once at the end with the final values.
 *
 * Nests safely (uses alien-signals' depth counter under the hood) and runs
 * the final flush in a `try`/`finally`, so a thrown exception inside the
 * callback still closes the batch.
 *
 * **Use it when:**
 * - A method writes several related fields and you want consumers to see
 *   one consistent snapshot, not an intermediate state with only half
 *   updated.
 * - You're applying a list of changes in a loop and want to avoid the
 *   re-render storm.
 *
 * **Don't use it when:**
 * - The writes are already sequential within a single synchronous callback
 *   that doesn't itself read signals between writes — alien-signals already
 *   coalesces those at the React render boundary.
 *
 * @typeParam T - The callback's return type, forwarded through.
 * @category State
 * @param fn - The work to perform inside the batch.
 * @returns Whatever `fn` returns.
 * @example
 * ```ts
 * class Form {
 *   name = state('');
 *   email = state('');
 *   age = state(0);
 *
 *   reset() {
 *     batch(() => {
 *       this.name('');
 *       this.email('');
 *       this.age(0);
 *     });
 *     // Subscribers see exactly one update with all three values reset.
 *   }
 * }
 * ```
 */
export function batch<T>(fn: () => T): T {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}

/**
 * Raw batch open/close. Prefer `batch(fn)` — it pairs the close in a
 * `finally`. Exposed for cases where the batch must span control flow
 * `batch()` can't wrap (e.g. opening a batch in one event handler and
 * closing it in another).
 *
 * Always call `endBatch()` exactly once per `startBatch()`. Mismatched
 * calls leave subscribers permanently paused.
 *
 * @category State
 */
export { startBatch, endBatch };

/**
 * Reactive getter/setter signature, mirroring `state()`. Used by the
 * `computedState` overload that accepts an input — the returned function is
 * dual-purpose: read with `()`, write input with `(value)`.
 *
 * @internal
 */
type InputComputed<I, T> = {
  (): T;
  (input: I): void;
};

/**
 * Pick the return shape based on the callback's parameter list.
 *
 * - `[]` (literally zero params) → plain `() => T` getter.
 * - Anything else (one required param, one optional, one with default…) →
 *   dual getter/setter `InputComputed<I, T>`.
 *
 * Optional-param tuples like `[s?: string]` resolve `'length'` to the union
 * `0 | 1`, which does not satisfy `extends 0`. That's how default-arg
 * callbacks `(q = '') => …` (externally `(q?: string) => …`) land in the
 * input-variant branch instead of being silently treated as zero-arg.
 *
 * @internal
 */
/**
 * Brand used by `@react-logic/core`'s `useLogic` tracking pass to recognise
 * plain-function wrappers that internally subscribe to alien-signals
 * signals — `computedState`'s dual getter/setter, `fetchState` (in
 * `@react-logic/utils`), and any future reactive accessor. alien-signals'
 * `isComputed`/`isSignal` only match its own `bind`-produced functions, so
 * without this brand the framework would skip the field and never
 * subscribe to its updates.
 *
 * Use `Symbol.for` so the contract crosses package boundaries without an
 * import: any package can mark its wrappers with this brand, and core
 * recognises them uniformly.
 *
 * @category Internal
 */
export const REACTIVE_ACCESSOR_MARKER = Symbol.for(
  '@react-logic/reactive-accessor'
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComputedReturn<F extends (...args: any) => unknown> =
  Parameters<F>['length'] extends 0
    ? () => ReturnType<F>
    : undefined extends Parameters<F>[0]
      ? InputComputed<Parameters<F>[0], ReturnType<F>>
      : // Unsafe: callback's param doesn't accept `undefined`, but the
        // wrapped signal starts as `undefined`, so the first read would
        // crash. Returning `never` here makes the call site reject the
        // result, steering the user toward `(q = …) => …` or
        // `(q: T | undefined) => …`.
        never;

/**
 * Creates a reactive piece of state — a getter/setter function backed by a
 * signal. Reading inside an effect (or a `useLogic` tracking pass) registers
 * a subscription; writing notifies subscribers.
 *
 * The returned function plays both roles:
 * - `s()` reads the current value.
 * - `s(next)` writes a new value.
 *
 * Place `state()` calls on logic-class fields. `useLogic` walks the
 * instance, recognises signal-shaped fields, and re-renders the component
 * when any of them change.
 *
 * @typeParam T - The value type held by the signal. Inferred from `initialValue`.
 * @category State
 * @param initialValue - The initial value of the state.
 * @returns A function to get (no args) or set (one arg) the state value.
 * @example
 * ```ts
 * class Counter {
 *   count = state(0);
 *   inc() { this.count(this.count() + 1); }
 * }
 * ```
 */
export const state = signal;

/**
 * Pure derivation. The compute runs on first read and caches; it re-runs
 * only when a signal it depends on changes, and subscribers fire only if
 * the output value changes.
 *
 * @typeParam T - The computed value's type. Inferred from `fn`'s return.
 * @category State
 * @param fn - A function that returns the computed value.
 * @returns A getter for the latest computed value.
 * @example
 * ```ts
 * class Cart {
 *   items = state<Item[]>([]);
 *   total = computedState(() => this.items().reduce((s, i) => s + i.price, 0));
 * }
 * ```
 */
/**
 * Plain derivation — call `c()` to read the latest value.
 *
 * **Input variant** — if `fn` takes one parameter, `computedState` wraps an
 * internal signal as the input. The returned function is dual-purpose:
 * `c()` reads the derived value, `c(input)` writes the input. The signal
 * starts as `undefined`, so the parameter must accept `undefined`:
 *
 * - `(q: string | undefined) => …` — explicit, handle the undefined case
 *   inside the body.
 * - `(q = '') => …` — default-arg syntax. The default value is what the
 *   callback sees on the first read.
 *
 * A bare `(q: string) => …` (no default, no `| undefined`) is a type error
 * — the runtime would otherwise crash on the first read.
 *
 * @typeParam F - The callback's full signature; the return shape (plain
 *   getter vs. getter/setter) is picked off `Parameters<F>`.
 * @category State
 * @param fn - A function that returns the computed value, optionally from a
 *   wrapped input.
 * @returns Either a getter `() => T` (zero-param `fn`) or a dual
 *   getter/setter `InputComputed<I, T>` (one-param `fn`).
 * @example Plain
 * ```ts
 * class Cart {
 *   items = state<Item[]>([]);
 *   total = computedState(() => this.items().reduce((s, i) => s + i.price, 0));
 * }
 * ```
 * @example Input variant — default-arg form
 * ```ts
 * class Search {
 *   pattern = computedState((q = '') => new RegExp(q, 'i'));
 * }
 * const s = new Search();
 * s.pattern('foo'); // void — sets the input
 * s.pattern();      // RegExp(/foo/i)
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computedState<F extends (...args: any) => unknown>(
  fn: F
): ComputedReturn<F> {
  // Always wrap an input signal. For zero-param callbacks the signal is
  // never read and never written — alien-signals' computed only subscribes
  // to signals actually read inside `fn`, so it's free. This sidesteps the
  // `fn.length` problem: default-arg syntax `(q = '') => …` reports
  // `length === 0` at runtime, so we don't trust it.
  const input = signal<unknown>(undefined);
  const derived = computed(() => (fn as (i?: unknown) => unknown)(input()));

  function accessor(...args: unknown[]): unknown {
    if (args.length === 0) return derived();
    input(args[0]);
    return undefined;
  }
  // Brand the accessor so the framework's signal-detection picks it up.
  (accessor as unknown as Record<symbol, true>)[REACTIVE_ACCESSOR_MARKER] = true;
  return accessor as ComputedReturn<F>;
}

/**
 * Creates a reactive effect that runs whenever its dependencies change.
 *
 * The callback may return a cleanup function — same shape as React's
 * `useEffect`. Cleanup runs:
 * - Before each subsequent re-run, scoped to the previous invocation's deps.
 * - On final teardown — either when the user calls the returned stop, or
 *   automatically when the surrounding logic class / service scope is
 *   disposed (component unmount or `<Injector>` unmount).
 *
 * Inside a logic class or service constructor, the framework auto-tracks the
 * effect and runs the final cleanup on scope teardown — you usually don't
 * need the returned stop function. Outside that context (top-level scripts,
 * other manual setups), capture and call it yourself.
 *
 * @category State
 * @param fn - The effect body. Return a cleanup function (or `void`).
 * @returns A function that stops the effect and runs the latest cleanup.
 * @example
 * ```ts
 * import { effect, state } from '@react-logic/state';
 *
 * class WindowSize {
 *   width = state(window.innerWidth);
 *   height = state(window.innerHeight);
 *   constructor() {
 *     effect(() => {
 *       const handler = () => {
 *         this.width(window.innerWidth);
 *         this.height(window.innerHeight);
 *       };
 *       window.addEventListener('resize', handler);
 *       return () => window.removeEventListener('resize', handler);
 *     });
 *   }
 * }
 * ```
 */
export const effect = (fn: () => void | (() => void)): (() => void) => {
  let cleanup: void | (() => void);
  let stopped = false;

  const runCleanup = () => {
    if (typeof cleanup !== 'function') return;
    const fn = cleanup;
    cleanup = undefined;
    try {
      fn();
    } catch (e) {
      console.error('effect cleanup threw:', e);
    }
  };

  const innerStop = rawEffect(() => {
    runCleanup();
    cleanup = fn() ?? undefined;
  });

  const dispose = () => {
    if (stopped) return;
    stopped = true;
    runCleanup();
    innerStop();
  };

  // If we're inside a logic class or service construction, register the
  // dispose so it fires on scope teardown. Outside such a context the
  // onDestroy throws — caller is responsible for calling dispose manually.
  try {
    onDestroy(dispose);
  } catch {
    // not in a construction context — caller owns the lifecycle
  }

  return dispose;
};
