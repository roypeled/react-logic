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

Plus the bare-class shorthand:

```ts
SomeClass        // === { provide: SomeClass, useClass: SomeClass }
```

## useValue

For pre-built values: configuration, primitives, environmental data, mock instances.

```tsx
const API_URL = new InjectionToken<string>('API_URL');

<Injector provide={[{ provide: API_URL, useValue: 'https://api.test' }]} />
```

Cached forever (well, for the scope's lifetime). The reference you provide is the reference consumers receive — the container doesn't clone or freeze it.

## useClass

For classes the container should construct on first request:

```tsx
<Injector provide={[{ provide: Logger, useClass: ConsoleLogger }]} />
```

This is how you swap implementations: provide an interface or base class as the token, register a concrete impl as `useClass`. Useful for testing (mock impls) and environment switching (dev vs prod).

The bare-class shorthand `provide={[Logger]}` is `useClass: Logger` — the class is its own implementation.

The instance is constructed lazily on first inject and cached for the scope's lifetime. `onDestroy` callbacks registered during construction fire when the `<Injector>` unmounts.

## useFactory

For values that need control flow at construction time:

```tsx
<Injector provide={[{
  provide: ApiClient,
  useFactory: () => new ApiClient(loadConfig()),
}]} />
```

The factory runs once per scope on first request. Same caching as `useClass`. Use it when:

- Construction is conditional or branches.
- You need to compose dependencies that aren't already injectable.
- You're returning something that isn't a class instance.

For factories that themselves need DI, call `inject()` inside the factory body — the active scope is set during factory execution:

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

`inject(API_URL)` and `inject(Logger)` resolve through the same scope that's about to host `ApiClient`. The order of providers in the array doesn't matter — DI resolves by token identity at factory-execution time, not by array position.

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

If you `inject(SomeClass)` and no provider matches in any ancestor scope, the container auto-registers `{ provide: SomeClass, useClass: SomeClass }` on the **root** scope. Effect:

- Class tokens "just work" without explicit providers — useful for the common case.
- Auto-registered classes are global singletons (root-scoped). They live until HMR (in dev) or process termination (in prod).
- To get a fresh instance per scope, provide the class explicitly: `<Injector provide={[SomeClass]}>`.

`InjectionToken` tokens are *not* auto-registered — they have no constructor for the container to call. Inject them with `{ optional: true }` to get `null` when unprovided, or accept the `UnresolvedInjectionError`.

## Provider equality

`<Injector>` memoizes its scope by structural comparison of the provider array: same length, same `provide` tokens, same target (`useValue` value, `useClass` class, `useFactory` function). If those match render-to-render, the scope is reused — services don't churn. If anything differs, the old scope is disposed and a new one is created.

This makes inline `provide={[...]}` arrays safe in practice — the literal is reconstructed on every render, but the scope behind it is stable.
