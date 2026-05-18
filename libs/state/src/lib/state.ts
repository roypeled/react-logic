import { computed, effect as rawEffect, signal } from 'alien-signals';
import { onDestroy } from '@react-logic/di';

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
 * Creates a derived state that recomputes lazily when any signal it reads
 * changes — and crucially, only when *the value it returns* changes do its
 * own subscribers re-fire. Call shape mirrors `state()`: read with `c()`,
 * but there's no setter.
 *
 * Use it for any value that's a pure function of other reactive state. It's
 * cheaper than computing inside the render body because the result is
 * memoised across reads with the same upstream values.
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
 *   isEmpty = computedState(() => this.items().length === 0);
 * }
 * ```
 */
export const computedState = computed;

/**
 * Like `state()`, but seeded by an async producer. Starts as `undefined`,
 * resolves to the awaited value, and notifies subscribers when it does.
 *
 * The returned getter is read-only — there's no setter. The producer runs
 * inside an effect, so any signals it reads become tracked dependencies; if
 * those change, the producer re-runs and the value updates again. Useful
 * for derived async data that should reload when inputs change (e.g. a
 * fetch keyed off a user-id signal).
 *
 * No built-in error handling — wrap the producer in try/catch and store
 * status fields in companion `state()`s if you need richer states (loading,
 * error, success).
 *
 * @typeParam T - The resolved value's type. Inferred from `fn`'s return.
 * @category State
 * @param fn - A function that returns a promise; tracked for re-execution.
 * @return A getter for the resolved value, or `undefined` until the first
 *   resolve completes.
 * @example
 * ```ts
 * class UserProfile {
 *   userId = state<string | null>(null);
 *   profile = asyncState(async () => {
 *     const id = this.userId();
 *     if (!id) return null;
 *     return (await fetch(`/users/${id}`)).json();
 *   });
 * }
 * ```
 */
export const asyncState = <T>(fn:() =>  Promise<T>): () => T | undefined => {
  const value = signal<T | undefined>(undefined);

  rawEffect(async () => {
    value(await fn());
  });

  return value;
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
