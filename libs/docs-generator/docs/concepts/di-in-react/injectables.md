---
sidebar_position: 1
---

# Injectables

An **injectable** is anything the DI container can hand back when asked. Three flavors:

1. **Classes** — what you'll use most. The class doubles as both the *token* (identity) and the *implementation* (constructor).
2. **Values** — pre-built objects, primitives, configuration. Behind an `InjectionToken`.
3. **Factory results** — produced by a function the container calls on first request.

## Classes as injectables

```ts
class CartStore {
  items = state<Item[]>([]);
}
```

Anything that takes a zero-argument constructor is fair game. Constructor *needs* dependencies? It pulls them via `inject()`:

```ts
class CartLogic {
  api = inject(ApiClient);    // injected before the constructor body runs
  cart = inject(CartStore);
}
```

The container handles both: when `CartLogic` is constructed, the `inject()` calls in its field initializers resolve through the active scope.

### Auto-registration

If you `inject(SomeClass)` and no `<Injector>` provides `SomeClass`, the container auto-registers it on the **root** scope and creates an instance there. This means class-token injectables work with zero ceremony — no provider declaration needed for the common case.

If you *want* per-scope instances of a class, provide it explicitly: `<Injector provide={[SomeClass]}>` makes that scope construct its own copy.

## Tokens for non-class injectables

Configuration strings, primitive values, plain functions — anything without a class identity — needs an [`InjectionToken`](/docs/api/di/classes/InjectionToken) to give it a stable token:

```ts
import { InjectionToken } from '@react-logic/di';

export const API_URL = new InjectionToken<string>('API_URL');

// Provide
<Injector provide={[{ provide: API_URL, useValue: 'https://api.test' }]} />

// Inject
class ApiClient {
  url = inject(API_URL);
}
```

Token identity is by reference. Two `new InjectionToken('SAME')` calls produce two unrelated tokens. The description string is for debugging only.

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

For services (constructed via `inject()`), the callback fires when the providing `<Injector>` unmounts. Effects created inside the constructor — `effect()`, `asyncState()` — are tracked automatically and don't need an explicit `onDestroy`.

## What can't be injected

- Functions you intend to call as constructors with positional arguments. The container always uses zero-arg construction; pass arguments via injected dependencies or factories.
- React components. Components are mounted, not injected. If you need a component-as-data, pass it via props.
- Things from outside the scope tree (random globals, browser APIs). You can wrap them behind a token and provide them at the root, but there's no auto-import — the container only knows about what's in providers or class auto-registration.
