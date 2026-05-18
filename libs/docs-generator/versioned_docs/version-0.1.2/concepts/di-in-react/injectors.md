---
sidebar_position: 2
---

# Injectors

An **Injector** is a React component that defines a DI scope. Anything provided on it is available to the subtree below. Anything it creates is cleaned up when it unmounts.

```tsx
import { Injector } from '@react-logic/react-logic';

<Injector provide={[CartStore, { provide: API_URL, useValue: '/api' }]}>
  <App />
</Injector>
```

## What it does

1. Reads its parent scope from React context.
2. Creates a child scope with the providers you passed.
3. Renders its children inside a context boundary so descendants resolve through this scope.
4. On unmount, disposes the scope and runs `onDestroy` callbacks for every service it created locally.

## Where to place injectors

The most common placements:

- **At the app root**, around the whole tree, for application-wide services.
- **Around a feature subtree**, for services scoped to a feature. They live as long as the feature is mounted and get cleaned up when the user navigates away.
- **Around a routing boundary**, for services scoped to a route.

The implicit root scope (no `<Injector>` wrapping a tree) handles auto-registered class injectables. You don't *need* an `<Injector>` to use the framework. It only matters when you want to limit a service's lifetime, override providers, or supply non-class tokens.

## Nesting

Injectors compose. A child sees its own providers first, then walks up:

```tsx
<Injector provide={[{ provide: Theme, useValue: 'light' }]}>
  <Page />                                       {/* Theme = 'light' */}
  <Injector provide={[{ provide: Theme, useValue: 'dark' }]}>
    <Modal />                                    {/* Theme = 'dark' (overridden) */}
  </Injector>
</Injector>
```

A child scope is **not** a copy of the parent. It delegates lookups upward. Disposing the child doesn't touch services cached on the parent.

## Provider arrays

The `provide` prop accepts a mix of full provider objects and bare classes (shorthand for `useClass: SameClass`):

```tsx
<Injector provide={[
  CounterStore,                                  // shorthand for useClass
  { provide: API_URL, useValue: '/api' },        // value provider
  { provide: ApiClient, useFactory: () => new ApiClient(loadConfig()) },
]}>
```

The framework compares the array structurally on every render. The same provider list (same tokens, same targets, same length) reuses the existing scope. Inline `provide={[...]}` literals don't recreate services. Reordering or replacing a provider rebuilds the scope and disposes the old one.

## Avoid these injector smells

- **Wrapping every component in its own `<Injector>` "just in case."** A scope has overhead. Place it where lifetime actually matters.
- **Providing the same service twice in nested injectors.** Unless you really want two instances, the inner one shadows the outer, and consumers above the inner scope still see the outer copy.
- **Putting render-time state in providers.** `useValue` is a stable reference. Passing a value that changes per render rebuilds the scope.
