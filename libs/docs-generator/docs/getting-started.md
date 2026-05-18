---
sidebar_position: 2
---

# Getting Started

## Install

```bash
npm install @react-logic/react-logic
```

This package includes the three core pieces: `core` (the `useLogic` hook), `state` (`state`, `computedState`, `effect`, `batch`), and `di` (`inject`, `Injector`, tokens).

Optional helpers like `asyncState` and `fetchState` live in `@react-logic/utils`. Install it when you need them:

```bash
npm install @react-logic/utils
```

## A first logic class

```tsx
import { useLogic, state, computedState } from '@react-logic/react-logic';

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
2. `useLogic` creates an instance and re-renders the component when any signal it reads changes.
3. The component reads a signal by calling it (`logic.count()`) and writes by calling it with a value (`this.count(next)`).

No `useState`, no `useEffect`, no manual caching. The logic class is the source of truth.

## Sharing state with dependency injection

When two components need the same state, lift it to a **service** — another class — and inject it into both logic classes:

```tsx
import { inject } from '@react-logic/react-logic';

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

// No setup needed — both classes resolve `CartStore` from the root scope,
// and get the same instance.
<Header />   {/* uses CartCount → reads cart.items().length */}
<Sidebar />  {/* uses CartList  → reads cart.items() */}
```

That's it. Services are registered in a root scope by default, so `inject(CartStore)` just works. 

Optionally, use `<Injector provide={[…]}>` when you want to **scope** a service to a subtree (independent instances, or providing a different implementation for that branch).

## Cleanup

Anything a logic class or service starts (intervals, listeners, subscriptions) is cleaned up via `onDestroy()`:

```ts
import { onDestroy } from '@react-logic/react-logic';

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

- [Concepts](/docs/concepts) — how signals, DI, and scopes work.
- [Guides](/docs/guides) — walkthroughs of each part of the library.
- [Recipes](/docs/recipes) — code examples for common problems.
- [API Reference](/docs/api) — generated reference for every export.
