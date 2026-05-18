---
sidebar_position: 5
---

# Replacing services in tests

Production code declares `inject(SomeService)`. Tests provide a fake via the test injection scope. The logic class is none the wiser.

## The pattern

```ts
import { describe, it, expect, vi } from 'vitest';
import { createTestInjectionScope } from '@react-logic/core/testing';

class FakeApi {
  fetch = vi.fn(async () => ({ id: 1, name: 'Test Product' }));
}

it('uses the fake api', async () => {
  const t = createTestInjectionScope([{ provide: Api, useClass: FakeApi }]);
  const logic = t.build(ProductPageLogic);

  await logic.loadProduct();
  expect(logic.product()).toEqual({ id: 1, name: 'Test Product' });

  t.dispose();
});
```

`createTestInjectionScope` builds a scope, `t.build(LogicClass)` constructs a logic instance inside it, `t.dispose()` tears down everything (the logic's `onDestroy` callbacks, every service's `onDestroy`, the scope itself).

If you want to assert against the fake instance, use `useValue` so you keep the reference:

```ts
const fakeApi = new FakeApi();

const t = createTestInjectionScope([{ provide: Api, useValue: fakeApi }]);
const logic = t.build(ProductPageLogic);
await logic.loadProduct();

expect(fakeApi.fetch).toHaveBeenCalledOnce();
t.dispose();
```

## Stubbing token-backed values

For non-class tokens — config strings, URLs, feature flags — `useValue`:

```ts
const t = createTestInjectionScope([
  { provide: API_URL, useValue: 'http://localhost:9999' },
]);
const logic = t.build(ProductPageLogic);
```

## React-component tests

For tests that render through a component tree, use `<Injector>` directly with `@testing-library/react`:

```tsx
import { render, screen } from '@testing-library/react';
import { Injector } from '@react-logic/di';

it('shows the product', async () => {
  render(
    <Injector provide={[{ provide: Api, useClass: FakeApi }]}>
      <ProductPanel />
    </Injector>
  );
  expect(await screen.findByText(/Test Product/i)).toBeInTheDocument();
});
```

`createTestInjectionScope` is for unit tests of logic in isolation; `<Injector>` is for full-tree component tests.

## Async signals

`asyncState` resolves on the microtask queue. Two helpers cover the common shapes.

For producers with a known small number of awaited steps, `flushAsyncSignals()` flushes two ticks — enough for a one-await producer:

```ts
import { flushAsyncSignals, createTestInjectionScope } from '@react-logic/core/testing';

class Logic {
  data = asyncState(async () => 'hello');
}

it('resolves async data', async () => {
  const t = createTestInjectionScope();
  const logic = t.build(Logic);

  expect(logic.data()).toBeUndefined();
  await flushAsyncSignals();
  expect(logic.data()).toBe('hello');

  t.dispose();
});
```

For deeper or unpredictable chains, `flushAsyncSignalsUntil()` polls the read until it produces a non-undefined value, then returns it:

```ts
import { flushAsyncSignalsUntil } from '@react-logic/core/testing';

class Logic {
  data = asyncState(async () => {
    const seed = await fetchSeed();
    const enriched = await enrich(seed);
    return enriched;
  });
}

it('resolves a multi-step producer', async () => {
  const t = createTestInjectionScope();
  const logic = t.build(Logic);

  const data = await flushAsyncSignalsUntil(() => logic.data());
  expect(data.id).toBe(42);

  t.dispose();
});
```

`flushAsyncSignalsUntil` returns the resolved value, so no second read is needed. It throws if the getter is still `undefined` after 100 microtask flushes (configurable via `{ maxFlushes }`) — tests fail loudly instead of hanging.

For real-time delays (debounces, `setTimeout` in producers), microtask flushing isn't enough; use `vitest`'s fake timers or `findBy*` queries from testing-library.

## Mocking a service three layers deep

This is where DI earns its keep — and where test ergonomics start to look very different from `vi.mock`-based approaches.

A typical chain: a component uses a logic class, which injects a domain store, which injects a low-level HTTP service. We want to assert the component's behavior with a fake HTTP layer, without touching either the logic class or the store.

```ts
// Production code — unchanged in tests.
class HttpService {
  async fetch(url: string) { return fetch(url); }
}

class UserStore {
  http = inject(HttpService);
  user = state<User | null>(null);
  async load(id: string) {
    const res = await this.http.fetch(`/users/${id}`);
    this.user(await res.json());
  }
}

class ProfilePageLogic {
  store = inject(UserStore);
  open(id: string) { return this.store.load(id); }
}
```

The test:

```ts
class FakeHttp {
  fetch = vi.fn(async (url: string) => ({
    json: async () => ({ id: url.split('/').pop(), name: 'Test User' }),
  }));
}

it('loads users via the fake http service', async () => {
  const t = createTestInjectionScope([
    { provide: HttpService, useClass: FakeHttp },
    UserStore,
  ]);
  const logic = t.build(ProfilePageLogic);

  await logic.open('42');

  expect(logic.store.user()).toEqual({ id: '42', name: 'Test User' });
  t.dispose();
});
```

Two things in the providers list:

- The override at the leaf (`HttpService → FakeHttp`).
- An explicit `UserStore` registration.

The second one matters: without it, `UserStore` auto-registers on the *root* scope, constructs there, and its `inject(HttpService)` resolves through root — missing our test-scope override. By providing `UserStore` explicitly in the test scope, we force it to construct *here*, where the override is visible. The rule of thumb: any intermediate service whose dependencies you want to override has to be provided in the test scope.

`ProfilePageLogic` itself doesn't need to be in the providers list — `t.build()` constructs it directly in the scope.

### Why this is better than module mocks

The temptation in a `vi.mock`-style world is:

```ts
// Don't.
vi.mock('./http-service', () => ({
  HttpService: class { fetch = vi.fn(/* ... */); },
}));
```

This patches Node's module resolution. Every test in the file inherits the mock. Static analysis can't follow it. Refactoring is fragile (rename a file, the mock string is silently wrong). And every layer in the dependency chain has to either be mocked or play along — there's no concept of "override only at this leaf, leave the rest alone."

Dependency injection makes this declarative and local:

- The override is **explicit** — visible in the test, no hidden import-graph gymnastics.
- The override is **scoped** — only this test sees it. Other tests in the same file get the real implementation.
- The override is **typed** — `useClass: FakeHttp` is checked against `HttpService`'s shape at compile time.
- Refactoring is safe — rename `HttpService` and the type system catches the test's reference too.

This is one of the main reasons the framework runs everything through DI. Every `inject()` call is an extension point you can target from a test. You don't pay for it in production (the same calls just resolve normally), but you collect the testability when you need it.

## Verifying lifecycle (onDestroy)

Service `onDestroy` fires on scope dispose, *not* on logic-class dispose:

```ts
const cleanup = vi.fn();
class Service {
  constructor() { onDestroy(cleanup); }
}
class Logic {
  svc = inject(Service);
}

it('cleans up the service', () => {
  const t = createTestInjectionScope([Service]);
  t.build(Logic);
  expect(cleanup).not.toHaveBeenCalled();
  t.dispose();                          // service onDestroy fires
  expect(cleanup).toHaveBeenCalledOnce();
});
```

This is the test you write to catch leaks: anything that should be cleaned up — timers, listeners, subscriptions — verify it actually does.

## Visible adapter logs in test output

By default, `createTestInjectionScope` routes the default adapter's construction logs ("Creating class instance for X", etc.) through `console.log` so they show up in test output. Useful for understanding which services constructed in what order when a test fails.

Disable per-call:

```ts
const t = createTestInjectionScope(providers, { log: false });
```

Or globally with an environment variable in your test command or `.env`:

```bash
REACT_LOGIC_TEST_LOG=0 npm test
```

## Always dispose

Forgetting `t.dispose()` leaks state across tests, since shared services may persist on the root scope. Use `afterEach` for safety:

```ts
let t: ReturnType<typeof createTestInjectionScope>;

beforeEach(() => {
  t = createTestInjectionScope([/* providers */]);
});
afterEach(() => {
  t.dispose();
});
```

## See also

- [Concepts → Testing](/docs/concepts/testing) — broader testing strategy, async patterns.
- [Sharing services scoped to a tree](./scoped-services.md) — how the underlying scoping works.
- [Concepts → Providers](/docs/concepts/di-in-react/providers) — `useValue` vs `useClass` semantics.
