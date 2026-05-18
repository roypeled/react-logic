---
sidebar_position: 1
---

# Why react-logic?

React's component model encourages mixing **rendering** with **business logic**. State, side effects, derivation, and dependency wiring all live in the same function body that decides what's on screen. As a feature grows, the function grows; testing a piece of behavior means rendering a component.

react-logic separates the two:

- **Logic classes** — plain TypeScript classes that hold state and behavior. No React APIs inside, no rerenders, no hook rules.
- **The component** — calls `useLogic(MyLogic)`, reads signals, returns JSX. That's it.

## What you get

**Logic that's framework-agnostic in shape.** A logic class is just a class. You can construct it without React, write unit tests against it without `@testing-library/react`, and read it from a debugger without dancing around hook order.

**Real reactivity, not React's.** State is signal-backed. `count()` and `count(next)` read and write. Components subscribe automatically to whichever signals their logic class exposes — no `useState` chains, no manual selectors, no memoisation incantations.

**Dependency injection that scopes correctly.** Services live as long as the `<Injector>` that provides them — not as long as the component that consumes them. Hide and re-show a component without losing the work; tear down a feature and its services go with it.

**Adapters where they matter.** The DI layer is pluggable. The default adapter ships with the lib; the Angular adapter lets you back react-logic with Angular's `EnvironmentInjector` so you can share existing Angular services across a React tree.

## What it's not

- A state-management framework. No store, no actions, no time-travel devtools. State lives on logic instances; that's the whole model.
- A render optimisation library. The signal layer minimises re-renders, but if you're chasing per-microsecond render budgets, this is not where to look.
- An Angular port. The Angular adapter is interop, not migration.

## When to reach for it

Reach for react-logic when:

- A component has grown enough internal state and effects that it's hard to reason about.
- You want to share behavior across components without lifting it to context-and-reducer ceremony.
- You're already writing logic in classes (or want to) and find React's hook model fights that style.

If your component is genuinely stateless or trivially stateful, plain React is fine.
