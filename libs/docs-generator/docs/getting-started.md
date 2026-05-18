---
sidebar_position: 2
---

# Getting Started

## Install

```bash
npm install @react-logic/core @react-logic/state @react-logic/di
```

The signal primitives (`state()` / `computedState()` / `asyncState()` / `effect()`) all live in `@react-logic/state`.

## A first logic class

```tsx
import { useLogic } from '@react-logic/core';
import { state, computedState } from '@react-logic/state';

class CounterLogic {
  count = state(0);
  doubled = computedState(() => this.count() * 2);

  inc() { this.count(this.count() + 1); }
  dec() { this.count(this.count() - 1); }
}

export const Counter = () => {
  const logic = useLogic(CounterLogic);
  return (
    <div>
      <p>Count: {logic.count()} (×2: {logic.doubled()})</p>
      <button onClick={() => logic.inc()}>+</button>
      <button onClick={() => logic.dec()}>−</button>
    </div>
  );
};
```

That's the whole loop:

1. The class holds state via `state()` and derived values via `computedState()`.
2. `useLogic` constructs an instance, returns it, and re-renders the component when any signal it reads changes.
3. The component reads signals as functions (`logic.count()`) and writes by calling them with a value (`this.count(next)`).

No `useState`, no `useEffect`, no memoisation. The logic class is the source of truth.

## Sharing state with dependency injection

When two components need the same state, lift it to a **service** — another class — and inject it into both logic classes:

```tsx
import { inject, Injector } from '@react-logic/di';

class CartStore {
  items = state<Item[]>([]);
  add(item: Item) { this.items([...this.items(), item]); }
}

class CartCount {
  cart = inject(CartStore);
}

class CartList {
  cart = inject(CartStore);
}

// Provide the service once, near the root.
<Injector provide={[CartStore]}>
  <Header />   {/* uses CartCount → reads cart.items().length */}
  <Sidebar />  {/* uses CartList → reads cart.items() */}
</Injector>
```

The bare class `CartStore` in the `provide` array is sugar for `{ provide: CartStore, useClass: CartStore }`. Two consumers, one shared service. The service is constructed lazily on first inject and torn down when the `<Injector>` unmounts.

## Cleanup

Anything a logic class or service starts (intervals, listeners, subscriptions) is cleaned up via `onDestroy()`:

```ts
import { onDestroy } from '@react-logic/di';

class TimeService {
  now = state(Date.now());
  constructor() {
    const id = setInterval(() => this.now(Date.now()), 1000);
    onDestroy(() => clearInterval(id));
  }
}
```

For logic classes, the callback fires on component unmount. For services, on `<Injector>` unmount.

## Where to next

- [Concepts → Signals](/docs/concepts/signals) — `state` / `computedState` / `asyncState`, how reactivity works.
- [Concepts → DI in React](/docs/concepts/di-in-react/) — Injectors, Providers, Injectables in detail.
- [Recipes](/docs/recipes) — common patterns.
- [API Reference](/docs/api) — generated reference for every export.
