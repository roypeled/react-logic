---
sidebar_position: 1
---

# Signals

react-logic's reactivity is built on **signals**: values that change over time and notify anything reading them. You read a signal by calling it and write to it by calling it with a value. The core building blocks live in `@react-logic/state`. The async helper lives in the optional `@react-logic/utils`:

| Function | What it does |
|---|---|
| `state(initial)` | Holds a value you can read and write. `s()` reads, `s(next)` writes. |
| `computedState(fn)` | A value derived from other signals. Recalculates only when its inputs change. |
| `asyncState(fn)` | A value produced by an async function. Re-runs when the signals it reads change. |
| `effect(fn)` | Runs side effects when signals change. Can return a cleanup function. |
| `batch(fn)` | Groups several writes so anything reading them updates once at the end. |

`state`, `computedState`, `effect`, and `batch` ship in `@react-logic/state` (re-exported from `@react-logic/react-logic`). `asyncState` lives in the optional `@react-logic/utils` package.

## state

```ts
const count = state(0);
count();      // 0 — read
count(5);     // write
count();      // 5
```

`state()` returns a single function that's both getter and setter. Call it with no args to read; call it with one arg to write.

Put `state()` on a logic-class field, and `useLogic` re-renders the component whenever that signal changes. You don't need to subscribe. Reading a signal during render is enough.

## computedState

```ts
class Cart {
  items = state<Item[]>([]);
  total = computedState(() => this.items().reduce((s, i) => s + i.price, 0));
}
```

`computedState(fn)` derives a value from other signals. It only re-runs when one of the signals it reads changes. Anything reading it only updates if the result actually changed. Chains of computeds are cheap.

### Input variant

If the function takes an argument, the returned signal doubles as a setter. `c(input)` writes the input; `c()` reads the derived value:

```ts
class Search {
  pattern = computedState((q = '') => new RegExp(q, 'i'));
}

const s = new Search();
s.pattern('foo'); // void — writes the input
s.pattern();      // RegExp(/foo/i) — reads the derived value
```

Use it when a derived value depends on a single piece of state nothing else needs to read. It saves you from declaring a separate `state()` field. The [reactive state guide](/docs/guides/reactive-state#input-variant) covers when the input is `T` vs `T | undefined`.

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

`asyncState` re-runs its function whenever a signal it reads changes. Reading the result returns the latest resolved value, or `undefined` until the first resolve.

For cancellation and richer states (loading / error), see the [async state guide](/docs/guides/async-state).

## Batching writes

When a method updates several signals in sequence, each write triggers an update. Usually that's fine. When intermediate states would be inconsistent, or when an effect would do expensive work on every step, wrap the writes in `batch(fn)`:

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
    // One update fires, with all three values reset.
  }
}
```

`startBatch()` and `endBatch()` are also exported for cases where `batch()` can't wrap the code (for example, across async boundaries). See the [batch operations guide](/docs/guides/batch-operations).

## Effects (when you need them)

Sometimes you want a side effect (logging, persisting, syncing) to run whenever signals change, with no value to expose. Use `effect`:

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

Effects placed in a constructor are cleaned up automatically when the owning logic class or service is destroyed. The body can return a cleanup callback, like `useEffect`:

```ts
effect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
});
```

See the [reactive state guide](/docs/guides/reactive-state#effect) for tracking rules and anti-patterns.

## What's *not* a signal

A few things on a logic class look reactive but aren't:

- **Plain fields.** `name = ''` or `count = 0` are just regular properties. Reassigning them won't re-render the component. Wrap the value in `state()` when you want it reactive.
- **Methods.** A method is just a method. It can read and write signals inside; the method itself isn't tracked.
- **DOM refs.** react-logic doesn't manage refs. If you need direct DOM access, use a normal `useRef` inside the React component.
