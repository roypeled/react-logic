import './default-adapter';
import { getDIAdapter } from './adapter';

/**
 * Register a callback to run when the surrounding construction scope is torn
 * down. Must be called synchronously during a logic class or service
 * constructor (or as a field initializer). Throws otherwise.
 *
 * For logic classes, the callback fires when the consuming component
 * unmounts. For services constructed via DI, it fires when the providing
 * `<Injector>` unmounts.
 *
 * @category Functions
 * @example
 * ```ts
 * class TimeService {
 *   timer = state<ReturnType<typeof setInterval> | null>(null);
 *   constructor() {
 *     onDestroy(() => {
 *       const t = this.timer();
 *       if (t) clearInterval(t);
 *     });
 *   }
 * }
 * ```
 */
export const onDestroy = (fn: () => void): void => {
  getDIAdapter().onDestroy(fn);
};
