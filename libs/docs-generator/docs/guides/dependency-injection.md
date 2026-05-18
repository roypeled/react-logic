---
sidebar_position: 7
---

# Dependency injection

The DI layer in depth: how `inject`, `Injector`, and providers compose; how scopes are resolved and disposed; how to use it for shared state, swappable implementations, and bounded lifetimes.

For the high-level mental model — what a scope is, why this shape exists — see [Concepts → DI in React](/docs/concepts/di-in-react/). This guide assumes you've read that and focuses on day-to-day usage.

## inject — pulling from the active scope

```ts
import { inject } from '@react-logic/react-logic';

class CartLogic {
  cart = inject(CartStore);
  api = inject(ApiClient);
}
```

`inject(token)` resolves the token through the scope active at construction time and returns the cached instance (or constructs one on first request).

The constraint: `inject()` must run **synchronously during construction** — typically as a field initializer (as above) or in the constructor body. Calling it from a method, a callback, or after an `await` throws — the active scope is only set during construction.

## Auto-registration on the root scope

If you `inject(SomeClass)` and no `<Injector>` provides it, the container auto-registers it on the root scope and constructs an instance there. **Most apps don't need any `<Injector>` at all** — bare class injection just works:

```ts
class SessionStore {
  user = state<User | null>(null);
}

class HeaderLogic {
  session = inject(SessionStore);   // works, auto-registered on root
}
```

The root-scope instance is created once per app, shared across the whole tree, disposed only on full unmount (or HMR reset in dev).

Use an explicit `<Injector>` when you want:

- **Bounded lifetime** — service disposed when a feature/route closes.
- **Multiple independent instances** — e.g. two query builders on one page, each with their own state.
- **Per-tree overrides** — different implementation under different subtrees (the testing motivator).

## Injector — scoping a subtree

```tsx
import { Injector } from '@react-logic/react-logic';

<Injector provide={[CartStore, { provide: API_URL, useValue: '/api' }]}>
  <App />
</Injector>
```

The `<Injector>` reads its parent scope from context, creates a child scope with the listed providers, and renders its children inside a context boundary so descendants resolve through this scope. On unmount, the scope is disposed — `onDestroy` callbacks fire for every service constructed inside it.

### The resolution walk

```
<Injector provide={[Theme, Logger]}>          ← scope A
  <Injector provide={[ApiClient]}>            ← scope B (child of A)
    <Component />                             ← inject() walks B → A → root
  </Injector>
</Injector>
```

`inject(Logger)` from inside `<Component />`:
1. Check B's local providers — not found.
2. Check A's local providers — found, instantiate.
3. The `Logger` instance is cached on **A** (the scope that holds the provider).
4. Disposal happens when **A**'s `<Injector>` unmounts.

A child scope is not a *copy* of the parent — it delegates lookups upward. Disposing the child doesn't touch services cached on the parent.

## Providers

A provider tells an `<Injector>` how to produce an instance for a token. Three forms:

```ts
{ provide: Token, useValue: someValue }
{ provide: Token, useClass: SomeClass }
{ provide: Token, useFactory: () => createSomething() }
```

Plus the bare-class shorthand:

```ts
SomeClass        // === { provide: SomeClass, useClass: SomeClass }
```

### useClass

For classes the container should construct on first request. The bare-class form is sugar for this:

```tsx
<Injector provide={[
  Logger,                                          // useClass: Logger
  { provide: Logger, useClass: ConsoleLogger },    // explicit
]} />
```

The two-token form is how you swap implementations: declare an interface or base class as the token, register a concrete impl as `useClass`. Useful for testing (mock impls) and environment switching.

### useValue

For pre-built values: config, primitives, environmental data, mocks.

```ts
import { InjectionToken } from '@react-logic/react-logic';

const API_URL = new InjectionToken<string>('API_URL');

<Injector provide={[{ provide: API_URL, useValue: 'https://api.test' }]} />
```

Cached forever (or rather, for the scope's lifetime). The reference you provide is the reference consumers receive — no cloning or freezing.

`InjectionToken` identity is by reference. Two `new InjectionToken('SAME')` calls produce two unrelated tokens; the description string is for debugging only.

### useFactory

For values that need control flow at construction time, or that compose dependencies that aren't themselves injectable.

```tsx
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

The factory runs once per scope on first request and the result is cached. The active scope is set during factory execution, so `inject()` calls inside the factory body work the same as inside a class constructor. Provider array order doesn't matter — DI resolves by token identity at execution time.

## Override semantics

A child scope's provider shadows the parent's for that token, in the child subtree only. Siblings of the child see the parent's provider:

```tsx
<Injector provide={[{ provide: Theme, useValue: 'light' }]}>
  <A />                                         {/* light */}
  <Injector provide={[{ provide: Theme, useValue: 'dark' }]}>
    <B />                                       {/* dark */}
  </Injector>
  <C />                                         {/* light */}
</Injector>
```

This is the primary mechanism for test overrides — wrap the unit under test in an `<Injector>` that provides mocks for the tokens it would otherwise auto-register from the root.

## Lifetime in practice

The most common scope placements:

| Placement | Lifetime |
|---|---|
| Implicit root (no `<Injector>`) | App lifetime (auto-registered classes) |
| App-root `<Injector>` | App lifetime, but you control providers |
| Feature-subtree `<Injector>` | Feature mount/unmount |
| Route-boundary `<Injector>` | Route navigation |

A service's lifetime is the lifetime of the scope that constructed it. That scope is determined by *where the provider lives*, not by who injects.

### Cross-service references

Services can inject each other freely:

```ts
class CartStore {
  items = state<Item[]>([]);
}

class CartAnalytics {
  cart = inject(CartStore);
  constructor() {
    effect(() => reportMetric('cart.items', this.cart.items().length));
  }
}
```

`CartAnalytics` reaches `CartStore` through the same scope. Order in `provide` doesn't matter — resolution happens at inject time.

Eager construction: services aren't constructed until something injects them. If `CartAnalytics` is the entry point for analytics-as-a-side-effect, something has to inject it for its effect to start. Either a logic class somewhere under the `<Injector>` injects it, or a sibling service that *is* injected does.

## onDestroy in service constructors

The service's cleanup mechanism:

```ts
class TimeService {
  now = state(Date.now());
  constructor() {
    const id = setInterval(() => this.now(Date.now()), 1000);
    onDestroy(() => clearInterval(id));
  }
}
```

Fires when the providing `<Injector>` unmounts (not when a consumer unmounts). See [Reactive state → onDestroy](./reactive-state#ondestroy--for-the-things-signals-dont-own) for the mechanics.

## useInjector — for components that don't have a logic class

Most components don't call `inject()` directly — they call `useLogic(MyLogic)` and let the logic class do the injecting. If a component genuinely needs a service without a logic class around it, use the `useInjector` hook:

```tsx
import { useInjector } from '@react-logic/react-logic';

const ThemedComponent = () => {
  const theme = useInjector(Theme);
  return <div className={theme.name}>…</div>;
};
```

`useInjector` resolves against the active scope at render time. Treat it as an escape hatch — components-with-logic-classes is the recommended shape.

## Common patterns

### Shared store across a feature

```tsx
<Injector provide={[CartStore]}>
  <Header />
  <Routes>
    <Route path="cart" element={<CartList />} />
    <Route path="checkout" element={<Checkout />} />
  </Routes>
</Injector>
```

All three subtrees inject the same `CartStore`. Leaving the feature disposes it cleanly — no globals, no leaked sockets, no cross-tenant bleed.

### Test override

```tsx
<Injector provide={[{ provide: ApiClient, useClass: FakeApiClient }]}>
  <ComponentUnderTest />
</Injector>
```

The unit under test sees `FakeApiClient` wherever it would normally see `ApiClient`. See the [Testing guide](./testing) for the full setup.

### Per-instance scope

```tsx
{queries.map((q) => (
  <Injector key={q.id} provide={[QueryBuilderStore]}>
    <QueryBuilder query={q} />
  </Injector>
))}
```

Each `<QueryBuilder>` gets its own `QueryBuilderStore` instance, disposed when its row is removed.

## Smells to avoid

- **Wrapping every component in its own `<Injector>` "just in case."** A scope is overhead. Place it where lifetime actually matters; default to root-scope auto-registration otherwise.
- **Providing the same service twice in nested injectors.** Unless you genuinely want two instances, the inner one shadows the outer — and consumers above the inner scope still see the outer copy.
- **Putting render-time state in providers.** `useValue` is a stable reference; passing a value that changes per render churns the scope.
- **Defining service classes inside a component body.** Every render produces a *different* class identity, and the scope rebuilds. Define service classes at module scope.
- **Mixing React internals into services.** Don't pass `useState` setters or refs into a service. Services are framework-agnostic by design; mixing in React internals defeats the testability that motivates them.

## See also

- [Concepts → DI in React](/docs/concepts/di-in-react/) — the mental model and tree-walk diagrams.
- [Recipes → Sharing services scoped to a tree](/docs/recipes/scoped-services) — practical example.
- [Recipes → Provider override for a sub-tree](/docs/recipes/provider-override) — testing and environment swaps.
- [Testing guide](./testing) — using providers as the test seam.
