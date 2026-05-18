---
sidebar_position: 0
---

# DI in React

React doesn't ship a real dependency injection system. Context approximates one, but provider trees get unwieldy fast — every shared service becomes its own context, every consumer becomes a `useContext` call, and shared lifecycle (start / stop / cleanup) has nowhere natural to live.

react-logic adds a small DI layer over React's tree:

- **Injectables** — classes (or values, factories) that the container can produce on request. See [Injectables](./injectables.md).
- **Injectors** — React components that scope the available injectables to a subtree. See [Injectors](./injectors.md).
- **Providers** — declarations that bind a token to an implementation. See [Providers](./providers.md).

## The mental model

A scope is a *node in a tree*. The root is the global scope (implicit, no `<Injector>` needed). Each `<Injector>` wraps its children in a child scope. Resolution walks up the tree:

```
<Injector provide={[Theme, Logger]}>          ← scope A
  <Injector provide={[ApiClient]}>            ← scope B (child of A)
    <Component />                             ← inject() resolves through B → A → root
  </Injector>
</Injector>
```

`inject(Logger)` from inside `<Component />`'s logic class:
1. Checks B's local providers — not found.
2. Checks A's local providers — found, instantiate.
3. The Logger instance is cached on **A** (the scope that has the provider).
4. Disposal happens when **A**'s `<Injector>` unmounts.

That's the whole rule.

## Why it scopes correctly

Components mount and unmount on a different cadence than their data. Hide a panel — the panel's logic class is destroyed, but the data behind it (the service it injected) lives on the surrounding `<Injector>`'s scope and survives.

This is what context-based "service" patterns get wrong: when the consumer unmounts, there's no clean way to keep its services alive without lifting state to a global. Here, the surrounding `<Injector>` *is* the lift point, and lifetime follows the injector that provided the service — not the consumer that injected it.

## How it integrates with logic classes

`inject()` is called *synchronously inside a constructor or field initializer* of a logic class or service:

```ts
class CartLogic {
  store = inject(CartStore);   // resolves through the active scope
  api = inject(ApiClient);
}
```

The framework sets the active scope before `useLogic` constructs the logic instance, so plain `inject()` works without needing to thread injectors through props.

Outside a constructor (e.g. in a method body), `inject()` will throw — the active scope is only set during construction.

## What about React components themselves?

Components don't usually call `inject()` directly — they call `useLogic(MyLogic)` and let the logic class do the injecting. If a component genuinely needs to read a service without a logic class around it, use the [`useInjector`](/docs/api/di/variables/useInjector) hook.
