---
sidebar_position: 8
---

# Provider override for a sub-tree

A nested `<Injector>` can replace the implementation of any token for its children only. The rest of the app keeps the parent's implementation. This is how you do per-route theming, feature flags, or test-only swaps without touching the production code that consumes the service.

## The pattern

```tsx
<Injector provide={[{ provide: Theme, useValue: 'light' }]}>
  <Header />                  {/* Theme = 'light' */}
  <Content />                 {/* Theme = 'light' */}
  <Injector provide={[{ provide: Theme, useValue: 'dark' }]}>
    <Modal />                 {/* Theme = 'dark' (overridden) */}
  </Injector>
  <Footer />                  {/* Theme = 'light' */}
</Injector>
```

Resolution walks up: descendants of the inner Injector hit the local `Theme` first; siblings that aren't inside it walk straight up to the outer one.

## Use cases

### Per-route configuration

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

`AdminApp` and its services see the admin URL; everything else sees the regular URL. Same `inject(API_URL)` call, different value.

### Feature-flag-driven implementations

```tsx
const PaymentImpl = featureFlags.useStripeV2 ? StripeV2 : StripeV1;

<Injector provide={[{ provide: Payments, useClass: PaymentImpl }]}>
  <Checkout />
</Injector>
```

The `Checkout` subtree calls `inject(Payments)` and gets whichever class the flag selected. No conditional inside the consumer.

### Storybook / preview environments

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

Drop the wrapper around any story and the components inside use the fake services without code changes.

### Multiple instances of the same logical type

A list of independent panels, each with its own state:

```tsx
{panels.map((p) => (
  <Injector key={p.id} provide={[PanelStore]}>
    <Panel data={p} />
  </Injector>
))}
```

Each panel gets a *fresh* `PanelStore` because each `<Injector>` provides one locally. Sibling panels can't see each other's state — exactly what you want for "isolated instances of the same component."

## Override only what you need

A nested `<Injector>` doesn't need to re-provide everything. It adds (or replaces) a *subset* of providers; the rest still resolve through the parent:

```tsx
<Injector provide={[Logger, Api, AnalyticsClient]}>
  <App>
    <Injector provide={[{ provide: Logger, useClass: VerboseLogger }]}>
      <NoisySection />     {/* Logger overridden, Api & AnalyticsClient still come from above */}
    </Injector>
  </App>
</Injector>
```

This is the typical shape — small targeted overrides, broader scopes for shared services.

## Override doesn't backfill the parent

The override is **one-way down**. A consumer above the inner Injector still sees the parent's value. There's no mechanism to push a child's provider back up to the parent — and you wouldn't want there to be, because that would couple unrelated subtrees.

If two siblings need to share an override, lift the inner Injector to wrap both:

```tsx
// Wrong — A and B can't share the override.
<Injector provide={[Theme]}>
  <Injector provide={[{ provide: Theme, useValue: 'dark' }]}>
    <A />
  </Injector>
  <B />            {/* gets the outer Theme, not 'dark' */}
</Injector>

// Right — wrap both.
<Injector provide={[Theme]}>
  <Injector provide={[{ provide: Theme, useValue: 'dark' }]}>
    <A />
    <B />
  </Injector>
</Injector>
```

## Class identity matters

Override compares tokens by reference. If you redefine the class in two places, you have two different tokens — overrides won't match:

```ts
// File A
export class Logger { /* … */ }

// File B (accidentally redefined)
class Logger { /* … */ }       // different class!
```

Always import the exact class you're overriding. With `InjectionToken`, the same applies — there's no string-key match, only reference equality.

## Lifecycle on override

When the nested `<Injector>` mounts, it constructs its own instance for the overridden token (lazy — on first inject). When it unmounts, that instance is disposed. The parent's instance is untouched throughout. This is how short-lived overrides (modals, dialogs, transient routes) cleanly come and go.

## See also

- [Sharing services scoped to a tree](./scoped-services.md) — broader scope-management.
- [Replacing services in tests](./testing-mocks.md) — the testing-specific override case.
- [Concepts → Providers](/docs/concepts/di-in-react/providers) — override semantics in the model.
