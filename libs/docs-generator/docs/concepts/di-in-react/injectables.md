---
sidebar_position: 1
---

# Injectables

An **injectable** is anything the DI container can hand back when asked. Three kinds:

1. **Classes** — the most common. The class is both the token (its identity) and the implementation (its constructor).
2. **Values** — pre-built objects, primitives, or configuration. Each one needs an `InjectionToken`.
3. **Factory results** — values produced by a function the container calls the first time the token is requested.

## Classes as injectables

```ts
class CartStore {
  items = state<Item[]>([]);
}
```

Any class with a zero-argument constructor works. If the constructor needs dependencies, it gets them via `inject()`:

```ts
class CartLogic {
  api = inject(ApiClient);    // injected before the constructor body runs
  cart = inject(CartStore);
}
```

When `CartLogic` is constructed, the `inject()` calls in its field initializers resolve through the active scope.

### Auto-registration

If you `inject(SomeClass)` and no `<Injector>` provides `SomeClass`, the container auto-registers it on the **root** scope and creates an instance there. So class injectables work with no setup. You don't need a provider for the common case.

If you want per-scope instances of a class, provide it explicitly. `<Injector provide={[SomeClass]}>` makes that scope create its own copy.

## Tokens for non-class injectables

Configuration strings, primitive values, plain functions — anything that isn't a class — needs an [`InjectionToken`](/docs/api/di/classes/InjectionToken) to give it a stable identity:

```ts
import { InjectionToken } from '@react-logic/react-logic';

export const API_URL = new InjectionToken<string>('API_URL');

// Provide
<Injector provide={[{ provide: API_URL, useValue: 'https://api.test' }]} />

// Inject
class ApiClient {
  url = inject(API_URL);
}
```

Token identity is by reference. Two `new InjectionToken('SAME')` calls produce two unrelated tokens. The string is only for debugging.

## Lifecycle hooks

Any injectable can register cleanup with `onDestroy`:

```ts
class TimeService {
  timer = setInterval(() => {/*...*/}, 1000);
  constructor() {
    onDestroy(() => clearInterval(this.timer));
  }
}
```

For services (created via `inject()`), the callback fires when the providing `<Injector>` unmounts. Effects created in the constructor — `effect()`, `asyncState()` — are tracked automatically and don't need an explicit `onDestroy`.

## Constraints

A few things to be aware of — none of them mean "can't inject," just "use the right provider shape."

- **No constructor arguments.** When you provide a class (`useClass` or a bare class), the container creates it with `new C()` — no positional args. Pull what the class needs from `inject()` field initializers, or use `useFactory` if you really need to build the value with arguments.
- **Non-classes need a token.** Plain values, functions, React components, browser APIs — anything that isn't itself a class — can absolutely be injected, but the lookup key has to be an `InjectionToken<T>` (you can't use a value as its own key). Pair it with `useValue` / `useFactory`. See [Providers](./providers.md).
- **`inject()` runs at construction time only.** It's a field initializer or constructor call. Calling `inject()` from a method body throws — the active scope is only set while the instance is being built.

### React components as injectables

Components are just values, so you can inject them. Useful for slot patterns, theming, or letting a parent scope swap a child's rendering. Since a component doesn't need a logic class to render, pull it in directly with `useInjector`:

```tsx
const HeaderComponent = new InjectionToken<FC>('HeaderComponent');

const Page = () => {
  const Header = useInjector(HeaderComponent);
  return (
    <>
      <Header />
      <main>…</main>
    </>
  );
};

// Provide at the root, or override in a subtree:
<Injector provide={[{ provide: HeaderComponent, useValue: BrandedHeader }]}>
  <Page />
</Injector>
```

The container doesn't *render* anything — it just hands you the component reference, and `<Page>` decides where to put it in its JSX.
