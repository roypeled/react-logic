---
sidebar_position: 1
---

# Signals

react-logic's reactivity is built on **signals** — small reactive cells that read like getters and write like setters. Two core primitives live in `@react-logic/state`; the async helper lives in the optional `@react-logic/utils`:

| Primitive | Package | Purpose | Setter? |
|---|---|---|---|
| `state(initial)` | `@react-logic/state` | Mutable reactive cell. | Yes — `s(next)`. |
| `computedState(fn)` | `@react-logic/state` | Derived, memoised. Optionally takes an input. | Input variant only. |
| `asyncState(fn)` | `@react-logic/utils` | Async-seeded cell. | No. |
| `effect(fn)` | `@react-logic/state` | Reactive side effect with optional cleanup. | — |
| `batch(fn)` | `@react-logic/state` | Coalesce multiple writes into one notification. | — |

## state

```ts
const count = state(0);
count();      // 0 — read
count(5);     // write
count();      // 5
```

`state()` returns a single function that's both getter and setter. Calling with no args reads; calling with one arg writes.

Put `state()` on a logic-class field, and `useLogic` re-renders the component whenever that signal changes. You don't subscribe — reading a signal during render is enough.

## computedState

```ts
class Cart {
  items = state<Item[]>([]);
  total = computedState(() => this.items().reduce((s, i) => s + i.price, 0));
}
```

`computedState(fn)` derives a value from other signals. It only re-runs when one of the signals it reads has changed, and consumers fire only if the *output* changed. Chains of computeds are cheap.

### Input variant

If the compute callback takes an argument, the returned function doubles as a setter — `c(input)` writes, `c()` reads the derived value:

```ts
class Search {
  pattern = computedState((q = '') => new RegExp(q, 'i'));
}

const s = new Search();
s.pattern('foo'); // void — writes the input
s.pattern();      // RegExp(/foo/i) — reads the derived value
```

Use it when a derived value is keyed off a single piece of state that nothing else needs to read — saves declaring a separate `state()` field for it. The [reactive state guide](/docs/guides/reactive-state#input-variant) covers when the input is `T` vs `T | undefined`.

## asyncState

> Lives in the optional `@react-logic/utils` package. Install with `npm install @react-logic/utils`.

```ts
import { state } from '@react-logic/react-logic';
import { asyncState } from '@react-logic/utils';

class Search {
  query = state('');
  results = asyncState(async () => {
    const q = this.query();
    if (!q) return [];
    return (await fetch(`/search?q=${q}`)).json();
  });
}
```

`asyncState` re-runs its producer whenever a signal it reads changes. Reading the result returns the latest resolved value, or `undefined` until the first resolve.

For cancellation and richer states (loading / error), see the [async state guide](/docs/guides/async-state).

## Batching writes

When a method updates several signals in sequence, each write notifies subscribers. Most of the time this is fine. When intermediate states would be incoherent — or when an effect would do expensive work on every step — wrap the writes in `batch(fn)`:

```ts
import { batch, state } from '@react-logic/react-logic';

class Form {
  name = state('');
  email = state('');
  age = state(0);

  reset() {
    batch(() => {
      this.name('');
      this.email('');
      this.age(0);
    });
    // Subscribers fire once, with all three values reset.
  }
}
```

`startBatch()` / `endBatch()` are also exported for cases that span control flow `batch()` can't wrap. See the [batch operations guide](/docs/guides/batch-operations).

## Effects (when you need them)

Sometimes you want a side effect (logging, persisting, syncing) to run whenever signals change — but no value to expose. Use `effect`:

```ts
import { effect } from '@react-logic/react-logic';

class Logger {
  count = state(0);
  constructor() {
    effect(() => {
      console.log('count =', this.count());
    });
  }
}
```

Effects placed in a constructor are cleaned up automatically when the owning logic class or service goes away. The body may return a cleanup callback, useEffect-style:

```ts
effect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
});
```

See the [reactive state guide](/docs/guides/reactive-state#effect) for tracking rules and anti-patterns.

## What's *not* a signal

- Plain class fields (`name = ''`, `count = 0`) — assigning to them does **not** trigger re-renders. Use `state()` for anything reactive.
- Methods — they're just methods. Their internal calls to signals do work.
- Refs (`useRef`-style) — react-logic doesn't model these. If you need imperative DOM access, do it in the React component, not the logic class.
