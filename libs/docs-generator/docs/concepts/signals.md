---
sidebar_position: 1
---

# Signals

react-logic's reactivity is built on **signals** — small reactive cells that read like getters and write like setters. Three primitives live in `@react-logic/state`:

| Primitive | Purpose | Setter? |
|---|---|---|
| `state(initial)` | Mutable reactive cell. | Yes — `s(next)`. |
| `computedState(fn)` | Derived, memoised. | No. |
| `asyncState(fn)` | Async-seeded cell. | No. |

Under the hood they're [`alien-signals`](https://github.com/stackblitz/alien-signals) — but the framework only depends on a few of its operations, so swapping the runtime is possible if you ever need to.

## state

```ts
const count = state(0);
count();      // 0 — read
count(5);     // write
count();      // 5
```

`state()` returns a single function that's both getter and setter. Calling with no args reads; calling with one arg writes.

When you put a `state()` call on a logic-class field, `useLogic` finds it (by signal-shape detection), reads it during render, and re-renders when it changes.

## computedState

```ts
class Cart {
  items = state<Item[]>([]);
  total = computedState(() => this.items().reduce((s, i) => s + i.price, 0));
}
```

`computedState(fn)` runs `fn` on first read and caches the result. It re-runs only when one of the signals it read has changed — and even then, subscribers fire only if the *output* changed. That makes chains of computeds cheap.

## asyncState

```ts
class Search {
  query = state('');
  results = asyncState(async () => {
    const q = this.query();
    if (!q) return [];
    return (await fetch(`/search?q=${q}`)).json();
  });
}
```

The producer runs inside an effect. Any signal it reads becomes a tracked dependency: when one changes, the producer re-runs and the value updates. Reading the result returns the latest resolved value, or `undefined` until the first resolve.

`asyncState` has no built-in error handling, retries, or cancellation. For richer states (loading / error / data) compose with companion `state()`s yourself.

## Effects (when you need them)

Sometimes you want a side effect (logging, persisting, calling an external API) to run whenever signals change — but no value to expose. Use `effect` from `@react-logic/state` directly inside a logic class constructor:

```ts
import { effect } from '@react-logic/state';

class Logger {
  count = state(0);
  constructor() {
    effect(() => {
      console.log('count =', this.count());
    });
  }
}
```

`useLogic` wraps the constructor in a tracking scope, so the effect is automatically disposed when the component unmounts. For service-side effects (in classes constructed via `inject()`), the framework opens its own scope so the effect lives as long as the providing `<Injector>`, not the consuming component.

The effect body may return a cleanup function — useEffect-style. It fires before each subsequent re-run and on final teardown:

```ts
effect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
});
```

## How re-renders happen

`useLogic` walks the logic instance and any injected services, reads each signal field once during render-tracking, and subscribes the component to those reads. When any subscribed signal changes, the component re-renders.

You don't manually subscribe. You don't pick what to track. Reading a signal anywhere in the render path is enough.

## What's *not* a signal

- Plain class fields (`name = ''`, `count = 0`) — assigning to them does **not** trigger re-renders. Use `state()` for anything reactive.
- Methods — they're just methods. Their internal calls to signals do work.
- Refs (`useRef`-style) — react-logic doesn't model these. If you need imperative DOM access, do it in the React component, not the logic class.
