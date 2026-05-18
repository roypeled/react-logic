---
sidebar_position: 4
---

# Sharing services scoped to a tree

Multiple components need the same state. They live under a common parent, but the state shouldn't be a global — when the user leaves the parent (closes a modal, navigates away from a route), the state should go with it.

This is the bread-and-butter case for `<Injector>`: a service that **outlives any one consumer but dies with the surrounding tree**.

## The pattern

```tsx
import { Injector, inject } from '@react-logic/di';
import { state, computedState } from '@react-logic/state';

// The shared service.
class CartStore {
  items = state<Item[]>([]);
  total = computedState(() => this.items().reduce((s, i) => s + i.price, 0));

  add(item: Item) { this.items([...this.items(), item]); }
  remove(id: string) { this.items(this.items().filter((i) => i.id !== id)); }
  clear() { this.items([]); }
}

// Three logic classes, each scoped to their component, all reaching the same store.
class HeaderLogic { cart = inject(CartStore); }
class CartListLogic { cart = inject(CartStore); }
class CheckoutLogic { cart = inject(CartStore); }

// Provide once at the lifetime boundary.
export const ShopPage = () => (
  <Injector provide={[CartStore]}>
    <Header />
    <Routes>
      <Route path="cart" element={<CartList />} />
      <Route path="checkout" element={<Checkout />} />
    </Routes>
  </Injector>
);
```

All three logic classes reach the **same** `CartStore` instance. Adding from `CheckoutLogic.cart.add(...)` is visible immediately to `Header` (totals badge updates), `CartList` (line item appears), and any other consumer in the subtree.

When the user leaves `<ShopPage>`, the `<Injector>` unmounts, `CartStore` is disposed, and the cart resets cleanly. Re-enter the page → fresh cart, no leakage.

## Why this is different from globals

A module-level singleton would also let three components share state — but it lives forever. Two side-effects of "forever":

1. **No cleanup.** If `CartStore` opened a websocket or polled a server, it keeps doing that even when no one's looking.
2. **Cross-tenant bleed.** In a multi-account UI, switching accounts has to manually clear every singleton, or stale data leaks.

A scoped service ties lifetime to a tree boundary — disposal is automatic, isolation is automatic.

## Sibling trees, independent instances

Two `<Injector>` siblings each get their own `CartStore`:

```tsx
<>
  <Injector provide={[CartStore]}>
    <ShopA />        {/* its own cart */}
  </Injector>
  <Injector provide={[CartStore]}>
    <ShopB />        {/* a separate cart */}
  </Injector>
</>
```

Each subtree has its own scope, its own cached instance. No mediation needed.

## Multiple services in one scope

A scope can host as many services as you like — they're independent, instantiated on demand:

```tsx
<Injector provide={[CartStore, ProductCatalog, RecentlyViewed]}>
  <ShopPage />
</Injector>
```

Anything injected from inside the subtree resolves through this scope. Services that don't get injected are never instantiated — providers are lazy.

## Cross-service references

Services can inject each other freely:

```ts
class CartStore {
  items = state<Item[]>([]);
}

class CartAnalytics {
  cart = inject(CartStore);
  constructor() {
    // `effect` is exported from @react-logic/state.
    effect(() => {
      const count = this.cart.items().length;
      reportMetric('cart.items', count);
    });
  }
}

<Injector provide={[CartStore, CartAnalytics]}>
  …
</Injector>
```

`CartAnalytics` reaches `CartStore` through the same scope. The order in `provide` doesn't matter — resolution happens at inject time.

If `CartAnalytics` is never injected by anyone, it's never constructed. Force eager construction by injecting it from a logic class somewhere under the `<Injector>`, or from a sibling service that *is* injected.

## Hierarchical sharing

Sometimes you want a service shared by an outer scope, with refinements per inner scope:

```tsx
<Injector provide={[CartStore]}>           {/* one CartStore for the whole shop */}
  <Sidebar />
  <Injector provide={[ProductFilters]}>    {/* filters scoped to one section */}
    <Listings />
  </Injector>
  <Injector provide={[ProductFilters]}>    {/* a different filter set */}
    <Search />
  </Injector>
</Injector>
```

`<Listings />` and `<Search />` share the cart but have independent filter state.

## Lazy initialisation pattern

Services don't need to do anything in their constructor. Lazy work runs when something reads it:

```ts
class ProductCatalog {
  private _all = asyncState(async () => (await fetch('/products')).json());

  byId(id: string) {
    const all = this._all();
    return all?.find((p) => p.id === id);
  }
}
```

The fetch only fires the first time something calls `byId` (or otherwise reads `_all`). Subsequent reads use the cached value.

## When a service is overkill

If only *one* component needs the state and you don't need it to survive remounts, put it on a regular logic class. A service introduces a scope boundary, a provider declaration, and a lifetime question — it's worth it when you actually need shared lifetime, not for every reusable bag of state.

## When *not* to reach for `<Injector>`

A service used without an explicit `<Injector>` auto-registers on the root scope. That's the default for a reason: most stores are big enough to encapsulate a whole feature (a cart, a session, a settings store), and one instance per app is exactly the right granularity. The whole-app singleton is fine — and simpler. Reach for `<Injector>` when you need:

- **Multiple independent instances** of the same service on one page — e.g. a complex UI feature like a query builder, where several builders coexist and each needs its own state, cache, and validation graph that don't bleed into the others.
- **Bounded lifetime** — the service should be disposed when a feature/route closes, releasing timers, sockets, or large caches.
- **Per-tree overrides** — different implementations under different subtrees.

If none of those apply, skip the wrapper. Just `inject(MyStore)` from anywhere; the framework handles the rest.

## Gotchas

- **Providing per-render.** Inline `<Injector provide={[CartStore]}>` is fine — the framework structurally compares the provider list. But if `provide` references a render-local class (`class Foo {}` defined inside the component body), every render sees a *different* class identity, and the scope churns. Define service classes at module scope.
- **Putting React state in services.** Don't pass `useState` setters or refs into a service. Services are framework-agnostic by design; mixing in React internals defeats the testability that motivates them.

## See also

- [Persistent state across hide/show](./persistent-state.md) — the simpler one-component version.
- [Provider override for a sub-tree](./provider-override.md) — different impl in a nested Injector.
- [Concepts → Injectors](/docs/concepts/di-in-react/injectors) — placement and nesting rules.
