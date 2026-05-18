---
sidebar_position: 4
---

# Provider override for a sub-tree

A nested `<Injector>` replaces a token for its children only. Per-route theming, feature flags, environment swaps.

```tsx
<Injector provide={[{ provide: Theme, useValue: 'light' }]}>
  <Header />                                                    {/* light */}
  <Injector provide={[{ provide: Theme, useValue: 'dark' }]}>
    <Modal />                                                   {/* dark */}
  </Injector>
  <Footer />                                                    {/* light */}
</Injector>
```

## Per-route configuration

```tsx
<Injector provide={[{ provide: API_URL, useValue: 'https://api.prod' }]}>
  <Routes>
    <Route path="/admin" element={
      <Injector provide={[{ provide: API_URL, useValue: 'https://admin-api.prod' }]}>
        <AdminApp />
      </Injector>
    } />
    <Route path="/*" element={<MainApp />} />
  </Routes>
</Injector>
```

## Feature-flag-driven implementation

```tsx
const PaymentImpl = featureFlags.useStripeV2 ? StripeV2 : StripeV1;

<Injector provide={[{ provide: Payments, useClass: PaymentImpl }]}>
  <Checkout />
</Injector>
```

## Storybook / preview wrapper

```tsx
const StoryWrapper = ({ children }) => (
  <Injector provide={[
    { provide: Api, useClass: MockApi },
    { provide: Auth, useValue: fakeUser },
  ]}>
    {children}
  </Injector>
);
```

## Per-instance scope

```tsx
{panels.map((p) => (
  <Injector key={p.id} provide={[PanelStore]}>
    <Panel data={p} />
  </Injector>
))}
```

Each `<Panel>` gets its own `PanelStore`. It's disposed when the row is removed.

## See also

- [Sharing services scoped to a tree](./scoped-services.md)
- [Dependency injection guide](/docs/guides/dependency-injection)
- [Testing guide](/docs/guides/testing) — provider override as the test boundary.
