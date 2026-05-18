---
sidebar_position: 1
---

# Why react-logic?

React mixes **rendering** with **business logic**. State, side effects, derived values, and dependencies all live in the same function that decides what's on screen. As a feature grows, the function grows. Testing a piece of behavior means rendering a component.

react-logic separates the two:

- **Logic classes** — plain TypeScript classes that hold state and behavior. No React APIs inside, no rerenders, no hook rules.
- **The component** — calls `useLogic(MyLogic)`, reads signals, returns JSX. That's it.

## What you get

**Logic decoupled from React.** A logic class is just a class. You can create one without React, unit test it without `@testing-library/react`, and step through it in a debugger without worrying about hook order.

**Real reactivity.** State is built on signals. `count()` reads, `count(next)` writes. Components automatically re-render when any signal they read changes — no `useState` chains, no manual selectors, no `useMemo` boilerplate.

**Dependency injection with the right lifetimes.** Services live as long as the `<Injector>` that provides them, not as long as the component that uses them. You can hide and re-show a component without losing its state. Remove a feature and its services go with it.

**Adapters where they matter.** The DI layer is pluggable. The default adapter ships with the library. The Angular adapter lets you back react-logic with Angular's `EnvironmentInjector` so you can share Angular services across a React tree.

## What it's not

- A central store. No global store, no actions, no time-travel devtools. State lives on the logic instance that owns it — local where it should be local, shared via DI where it should be shared. It's still state management, just without the boilerplate.
- A render optimizer by default. Signals do cut re-renders, and you can opt into more control with `batch()` or by keeping fine-grained reads inside the component. If you need per-microsecond render budgets, that's still on you.

## When to reach for it

Pick the concept that matches the job:

- **Logic class — for component-local reactive state.** When a component has more state and effects than it can carry cleanly, move them onto a logic class and wire it up with `useLogic`. State, computed values, and methods all live in one place, type-checked together, and React re-renders when the signals you read change.
- **Injectable service — for shared stores.** When more than one component (or more than one logic class) needs the same state, lift it into a class and provide it through `<Injector>`. Anything in that subtree can `inject()` it. The service outlives individual mounts, so toggling a component off and on doesn't lose its data.
- **Both, together.** A common shape: a thin logic class per component for view-specific state, injecting one or more services for shared concerns (auth, cart, current user, etc.).

### Testing is the easy part

Logic classes and services are plain classes that run outside React. The framework ships a small test helper that builds them inside an injection scope, so you can swap any dependency for a fake without touching the class under test or rendering anything:

```ts
import { createTestInjectionScope } from '@react-logic/core/testing';

const test = createTestInjectionScope([
  { provide: Api, useValue: { fetchItems: async () => [{ id: 1, price: 10 }] } },
]);
const logic = test.build(CartLogic);

await logic.load();
expect(logic.total()).toBe(10);

test.dispose();
```

That's it: one provider override, one `build()` call, no rendering, no `renderHook`, no provider tree.

Because logic lives on a class instead of inside a component, the state and methods are directly inspectable. You can read `logic.total()`, assert on `logic.cart.items()`, call `logic.checkout()` and check what changed. A React component is opaque by comparison — it returns JSX and that's all you get to see from the outside. Tests against components end up asserting on rendered output as a proxy for state; here you assert on the state itself.

The full testing guide covers async flushing and a few other helpers.

If your component is stateless or only has a little state, plain React is fine.
