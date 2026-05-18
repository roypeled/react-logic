/**
 * A list of destroy callbacks belonging to a single construction scope.
 */
export type DestroySink = Array<() => void>;

const sinkStack: DestroySink[] = [];

/**
 * Opens a new destroy sink. Subsequent `onDestroy` calls within the same
 * synchronous construction will register into this sink. Must be paired with
 * `popDestroySink`. Internal API — callers are `useLogic` (logic class scope)
 * and `InjectionContextInstance` (per-service scope).
 */
export const pushDestroySink = (): DestroySink => {
  const sink: DestroySink = [];
  sinkStack.push(sink);
  return sink;
};

/**
 * Closes the topmost destroy sink. Returns the sink that was just closed.
 */
export const popDestroySink = (): DestroySink | undefined => sinkStack.pop();

/**
 * Runs every callback in the sink in reverse-registration order, swallowing
 * and logging individual failures so one bad cleanup doesn't block others.
 */
export const runDestroySink = (sink: DestroySink) => {
  for (let i = sink.length - 1; i >= 0; i--) {
    try {
      sink[i]();
    } catch (e) {
      console.error('onDestroy callback threw:', e);
    }
  }
  sink.length = 0;
};

/**
 * Registers a callback to run when the surrounding construction scope is torn
 * down. Must be called synchronously during a logic class or DI-managed
 * service constructor (or as a field initializer). Throws otherwise.
 *
 * @example
 * ```ts
 * class TimeService {
 *   timer = state(null as ReturnType<typeof setInterval> | null);
 *
 *   constructor() {
 *     onDestroy(() => {
 *       const t = this.timer();
 *       if (t) clearInterval(t);
 *     });
 *   }
 * }
 * ```
 */
export const onDestroy = (fn: () => void) => {
  const sink = sinkStack.at(-1);
  if (!sink) {
    throw new Error(
      'onDestroy() must be called during logic class or injected service construction'
    );
  }
  sink.push(fn);
};
