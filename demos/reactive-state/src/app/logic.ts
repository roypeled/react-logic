import {
  computedState,
  effect,
  onDestroy,
  state,
} from '@react-logic/react-logic';

const STORAGE_KEY = 'react-logic-demo:count';
const isBrowser = typeof window !== 'undefined';

/**
 * Counter logic — shows the three reactive-state primitives working together:
 *
 *   - `state(initial)`   — `count` is mutable, signal-shaped.
 *   - `computedState(fn)` — `doubled` derives from `count`; memoised, only
 *                            recomputes when `count` changes.
 *   - `effect(fn)`        — persistence to localStorage on every write,
 *                            auto-disposed when the consuming component
 *                            unmounts.
 *   - `onDestroy(fn)`     — side-channel cleanup for the running clock
 *                            interval, which is not a signal.
 */
export class CounterLogic {
  count = state(
    isBrowser ? Number(localStorage.getItem(STORAGE_KEY) ?? 0) : 0
  );
  doubled = computedState(() => this.count() * 2);
  now = state(Date.now());

  constructor() {
    effect(() => {
      if (!isBrowser) return;
      localStorage.setItem(STORAGE_KEY, String(this.count()));
    });

    const id = setInterval(() => this.now(Date.now()), 1000);
    onDestroy(() => clearInterval(id));
  }

  inc() {
    this.count(this.count() + 1);
  }
  dec() {
    this.count(this.count() - 1);
  }
  reset() {
    this.count(0);
  }
}
