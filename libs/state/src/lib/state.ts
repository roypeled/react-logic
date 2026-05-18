import { computed, effect, signal } from 'alien-signals';

/**
 * Creates a reactive state variable.
 * @param initialValue - The initial value of the state.
 * @returns A function to get or set the state value.
 * @example
 * ```ts
 * const count = state(0);
 * console.log(count()); // Get the current value
 * count(5); // Set a new value
 * console.log(count()); // 5
 * ```
 */
export const state = signal;

/**
 * Creates a computed state that automatically updates when its dependencies change.
 * @param fn - A function that returns the computed value.
 * @returns The computed value.
 * @example
 * ```ts
 * const count = state(2);
 * const doubleCount = computedState(() => count() * 2);
 * console.log(doubleCount()); // 4
 * count(3);
 * console.log(doubleCount()); // 6
 * ```
 */
export const computedState = computed;

/**
 * Creates an asynchronous state that updates when the promise resolves.
 * @param fn - A function that returns a promise.
 * @return A function to get the current value of the asynchronous state, or undefined if not yet resolved.
 * @example
 * ```ts
 * const asyncValue = asyncState(async () => {
 *   const response = await fetch('https://api.example.com/data');
 *   return response.json();
 * });
 *
 * // Usage
 * effect(() => {
 *   const value = asyncValue();
 *   if (value) {
 *     console.log('Async value:', value);
 *   } else {
 *     console.log('Loading...');
 *   }
 * });
 * ```
 */
export const asyncState = <T>(fn:() =>  Promise<T>): () => T | undefined => {
  const value = signal<T | undefined>(undefined);

  effect(async () => {
    value(await fn());
  });

  return value;
}

/**
 * Creates a reactive effect that runs whenever its dependencies change.
 * @param fn - The effect function to run.
 * @returns A cleanup function to stop the effect.
 * @example
 * ```ts
 * const count = state(0);
 * const stopEffect = effect(() => {
 *   console.log('Count changed:', count());
 * });
 *
 * count(1); // Logs: Count changed: 1
 * count(2); // Logs: Count changed: 2
 * // To stop the effect subscription:
 * stopEffect();
 * ```
 */
export default {effect}
