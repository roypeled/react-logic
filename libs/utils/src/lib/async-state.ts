import { effect as rawEffect, signal } from 'alien-signals';

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
 * @category Async
 * @param fn - A function that returns a promise; tracked for re-execution.
 * @return A getter for the resolved value, or `undefined` until the first
 *   resolve completes.
 * @example
 * ```ts
 * import { asyncState } from '@react-logic/utils';
 * import { state } from '@react-logic/state';
 *
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
export const asyncState = <T>(fn: () => Promise<T>): (() => T | undefined) => {
  const value = signal<T | undefined>(undefined);

  rawEffect(async () => {
    value(await fn());
  });

  return value;
};
