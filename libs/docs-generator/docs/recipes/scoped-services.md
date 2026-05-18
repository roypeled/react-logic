---
sidebar_position: 3
---

# Sharing services scoped to a tree

One service, multiple components, lifetime bounded by an `<Injector>`. Leave the feature → service is disposed cleanly.

```tsx
import {
  Injector,
  inject,
  state,
  computedState,
} from '@react-logic/react-logic';

class CartStore {
  items = state<Item[]>([]);
  total = computedState(() =>
    this.items().reduce((s, i) => s + i.price, 0)
  );

  add(item: Item) { this.items([...this.items(), item]); }
  remove(id: string) { this.items(this.items().filter((i) => i.id !== id)); }
  clear() { this.items([]); }
}

class HeaderLogic { cart = inject(CartStore); }
class CartListLogic { cart = inject(CartStore); }
class CheckoutLogic { cart = inject(CartStore); }

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

All three logic classes reach the same `CartStore`. Leaving `<ShopPage>` disposes it.

## Sibling trees, independent instances

```tsx
<>
  <Injector provide={[CartStore]}>
    <ShopA />
  </Injector>
  <Injector provide={[CartStore]}>
    <ShopB />
  </Injector>
</>
```

Two `<Injector>`s, two scopes, two independent stores.

## Multiple services in one scope

```tsx
<Injector provide={[CartStore, ProductCatalog, RecentlyViewed]}>
  <ShopPage />
</Injector>
```

Services that nothing injects are never instantiated — providers are lazy.

## See also

- [Persistent state across hide/show](./persistent-state.md)
- [Provider override for a sub-tree](./provider-override.md)
- [Dependency injection guide](/docs/guides/dependency-injection)
