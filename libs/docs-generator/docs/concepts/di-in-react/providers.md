---
sidebar_position: 3
---

# Providers

A **provider** tells an `<Injector>` how to produce an instance for a token. Three forms:

```ts
{ provide: Token, useValue: someValue }                // value
{ provide: Token, useClass: SomeClass }                // class
{ provide: Token, useFactory: () => createSomething() } // factory
```

Plus the class shorthand:

```ts
SomeClass        // === { provide: SomeClass, useClass: SomeClass }
```

## useValue

For pre-built values: configuration, primitives, environment data, or mock instances.

```tsx
const API_URL = new InjectionToken<string>('API_URL');

<Injector provide={[{ provide: API_URL, useValue: 'https://api.test' }]} />
```

Cached for the scope's lifetime. The reference you provide is the reference consumers receive. The container doesn't clone or freeze it.

## useClass

For classes the container should construct on first request:

```tsx
<Injector provide={[{ provide: Logger, useClass: ConsoleLogger }]} />
```

This is how you swap implementations. Provide an interface or base class as the token, and register a concrete implementation with `useClass`. Useful for testing (mock implementations) and environment switching (dev vs prod).

The class shorthand `provide={[Logger]}` is the same as `useClass: Logger`. The class is its own implementation.

The instance is created the first time it's injected and cached for the scope's lifetime. `onDestroy` callbacks registered during construction fire when the `<Injector>` unmounts.

## useFactory

For values that need custom logic to construct:

```tsx
<Injector provide={[{
  provide: ApiClient,
  useFactory: () => new ApiClient(loadConfig()),
}]} />
```

The factory runs once per scope, the first time the token is requested. Same caching as `useClass`. Use it when:

- Construction depends on conditions or has branches.
- You need to combine dependencies that aren't already injectable.
- You're returning something that isn't a class instance.

If the factory itself needs DI, call `inject()` inside the factory body. The active scope is set while the factory runs:

```ts
class Logger { /* ... */ }
const API_URL = new InjectionToken<string>('API_URL');

<Injector provide={[
  Logger,
  { provide: API_URL, useValue: '/api' },
  {
    provide: ApiClient,
    useFactory: () => new ApiClient(inject(API_URL), inject(Logger)),
  },
]}>
  <App />
</Injector>
```

`inject(API_URL)` and `inject(Logger)` resolve through the same scope that's about to hold `ApiClient`. The order of providers in the array doesn't matter. DI resolves by token identity when the factory runs, not by array position.

## Override semantics

A child scope's provider shadows the parent's for that token, in the child subtree only. Siblings of the child still see the parent's provider:

```tsx
<Injector provide={[{ provide: Theme, useValue: 'light' }]}>
  <A />                                        {/* light */}
  <Injector provide={[{ provide: Theme, useValue: 'dark' }]}>
    <B />                                      {/* dark */}
  </Injector>
  <C />                                        {/* light */}
</Injector>
```

## Auto-registration of class tokens

If you `inject(SomeClass)` and no provider matches in any ancestor scope, the container auto-registers `{ provide: SomeClass, useClass: SomeClass }` on the **root** scope. The result:

- Class tokens "just work" without explicit providers. Useful for the common case.
- Auto-registered classes are global singletons (root-scoped). They live until HMR (in dev) or process termination (in prod).
- To get a fresh instance per scope, provide the class explicitly: `<Injector provide={[SomeClass]}>`.

`InjectionToken` tokens are *not* auto-registered. They have no constructor for the container to call. Inject them with `{ optional: true }` to get `null` when unprovided, or let `UnresolvedInjectionError` throw.

## Provider equality

`<Injector>` caches its scope by comparing the provider array structurally: same length, same `provide` tokens, same target (`useValue` value, `useClass` class, `useFactory` function). If those match between renders, the scope is reused and services aren't recreated. If anything differs, the old scope is disposed and a new one is created.

This makes inline `provide={[...]}` arrays safe in practice. The literal is rebuilt on every render, but the scope behind it is stable.
