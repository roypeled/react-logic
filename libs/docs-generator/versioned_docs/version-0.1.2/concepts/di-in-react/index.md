---
sidebar_position: 0
---

# Dependency injection in React

React doesn't include a real dependency injection system. Context comes close, but provider trees get unwieldy fast. Every shared service becomes its own context, every consumer needs a `useContext` call, and shared lifecycle (start, stop, cleanup) has nowhere natural to live.

react-logic adds a small DI layer on top of React's tree:

- **Injectables** — classes (or values, or factories) that the container can produce when asked. See [Injectables](./injectables.md).
- **Injectors** — React components that scope which injectables are available to a subtree. See [Injectors](./injectors.md).
- **Providers** — declarations that bind a token to an implementation. See [Providers](./providers.md).

## The mental model

Think of it as a tree of **scopes**. There's always a root scope (provided by the framework, no setup needed). Every `<Injector>` you add is a child scope wrapping its children.

When something calls `inject(X)`, the framework looks for `X` in the current scope first, then the parent, then the parent's parent, all the way up to the root. The first scope that knows how to make `X` wins, and that's where the instance lives.

```
<Injector provide={[Theme, Logger]}>          ← scope A: knows Theme, Logger
  <Injector provide={[ApiClient]}>            ← scope B: knows ApiClient
    <Component />                             ← lives in scope B
  </Injector>
</Injector>
```

A logic class inside `<Component />` calls `inject(Logger)`:

1. Look in scope B → not registered there.
2. Look in scope A → registered. Create the `Logger` instance.
3. Cache that instance on scope A.

From now on, anyone in scope A or anywhere below it that asks for `Logger` gets the same instance. When scope A's `<Injector>` unmounts, the instance is disposed.

The same rule applies to the root scope: anything not registered in any `<Injector>` is created and cached there, so it's shared across the whole app and only goes away when the app does.

## Why it scopes correctly

Components mount and unmount on a different schedule than their data. Hide a panel and the panel's logic class is destroyed, but the data behind it (the service it injected) lives on the surrounding `<Injector>`'s scope and survives.

You can do this with Context too — a Provider holds its value until it unmounts, no matter how many consumers come and go. The differences are mechanical:

- **One Provider per service.** Context gives you one slot per `createContext` call. Sharing N services means N nested Providers (or one mega-context that re-renders everything when anything inside it changes).
- **Lifecycle is manual.** With Context you usually `useState`/`useMemo` to construct and `useEffect` to clean up. With `<Injector>`, construction and disposal are tied to its mount/unmount automatically, and a service can register its own teardown via `onDestroy()`.
- **Lazy by default.** A service isn't created until something injects it. A Context Provider eagerly holds whatever you pass to `value`.
- **Constructor-time access.** `inject()` runs as a field initializer on the logic class — before any method runs, and without a hook. Services can inject other services the same way, so you don't need a hook chain in a component to wire dependencies together.

:::note Under the hood
`<Injector>` *is* a React Context Provider. The DI layer uses one Context to thread the current scope down the tree, and `inject()` reads it during construction. So this isn't replacing Context — it's wrapping it with a single, ergonomic API instead of one Context per service plus manual lifecycle glue.
:::

## How it integrates with logic classes

Call `inject()` inside the constructor or as a field initializer of a logic class or service:

```ts
class CartLogic {
  store = inject(CartStore);   // resolves through the active scope
  api = inject(ApiClient);
}
```

The framework sets the active scope before `useLogic` constructs the logic instance, so plain `inject()` works without passing injectors through props.

Calling `inject()` outside a constructor (for example, in a method body) throws. The active scope is only set during construction.

## What about React components themselves?

Components usually don't call `inject()` directly. They call `useLogic(MyLogic)` and let the logic class do the injecting. If a component really needs a service without a logic class around it, use the [`useInjector`](/docs/api/di/variables/useInjector) hook.
