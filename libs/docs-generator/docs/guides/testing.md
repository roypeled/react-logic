---
sidebar_position: 8
---

# Testing

Logic classes are plain TypeScript classes. Most of their behavior is testable without React at all. Where React is involved (mount/unmount lifecycle, signal-driven re-renders), `@testing-library/react` handles it cleanly. Where DI is involved, the same `<Injector>` that scopes services in production also works as the test boundary.

## Unit-testing a logic class with no DI

Construct, exercise, assert. No React, no `useLogic`, no `act()`:

```ts
import { describe, it, expect } from 'vitest';

class Counter {
  count = state(0);
  inc() { this.count(this.count() + 1); }
}

it('increments', () => {
  const c = new Counter();
  c.inc();
  expect(c.count()).toBe(1);
});
```

Signals are just functions. Reads and writes are synchronous. Computed values resolve on read. This is the cheapest, fastest layer to write tests in. Stay here when you can.

## Unit-testing a logic class with injected services

`createTestInjectionScope` from `@react-logic/core/testing` wraps the underlying adapter calls in one disposable handle. Production code is unchanged. The test scope provides fakes for the services the logic injects.

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

Three things to know:

- `createTestInjectionScope(providers)` builds a fresh scope with the given providers.
- `t.build(LogicClass)` constructs the logic class inside that scope. Same path `useLogic` would take, minus React.
- `t.dispose()` tears down everything: the logic's `onDestroy` callbacks, every service's `onDestroy`, the scope itself.

If you want to make assertions on the fake instance afterwards, use `useValue` so you keep a reference:

```ts
const fakeApi = new FakeApi();
const t = createTestInjectionScope([{ provide: Api, useValue: fakeApi }]);
const logic = t.build(ProductPageLogic);
await logic.loadProduct();

expect(fakeApi.fetch).toHaveBeenCalledOnce();
t.dispose();
```

### Mocking a service three layers deep

A typical chain: a component uses a logic class, which injects a domain store, which injects a low-level HTTP service. We want to test behavior with a fake HTTP layer, without touching the logic class or the store.

```ts
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
- An **explicit `UserStore` registration**.

The second matters. Without it, `UserStore` would auto-register on the *root* scope, construct there, and its `inject(HttpService)` would resolve through root — missing the test scope's override. By providing `UserStore` explicitly in the test scope, you force it to construct *here*, where the override is visible.

**Rule of thumb:** any intermediate service whose dependencies you want to override has to be provided in the test scope. `ProfilePageLogic` itself doesn't need providing. `t.build()` constructs it directly in the scope.

### Why this beats module mocks

The temptation:

```ts
// Don't.
vi.mock('./http-service', () => ({
  HttpService: class { fetch = vi.fn(/* … */); },
}));
```

This patches Node's module resolution. Every test in the file inherits the mock. Static analysis can't follow it. Refactoring breaks silently — rename a file and the mock string is wrong. Every layer in the dependency chain has to either be mocked or play along. There's no concept of "override only at this leaf."

DI makes this explicit and local:

- **Explicit.** The override is visible in the test. No hidden import-graph gymnastics.
- **Scoped.** Only this test sees it.
- **Typed.** `useClass: FakeHttp` is checked against `HttpService`'s shape at compile time.
- **Refactor-safe.** Rename `HttpService` and the type system catches the test's reference too.

Every `inject()` call is an extension point a test can target. The cost in production is zero. The testability is free.

## Component tests with `@testing-library/react`

For tests that render through a tree, use `<Injector>` directly:

```tsx
import { render, screen } from '@testing-library/react';
import { Injector } from '@react-logic/react-logic';

class FakeApi { fetch = vi.fn(() => Promise.resolve({ id: 1, name: 'Test' })); }

it('shows the product', async () => {
  render(
    <Injector provide={[{ provide: Api, useClass: FakeApi }]}>
      <ProductPanel />
    </Injector>
  );
  expect(await screen.findByText(/Test/i)).toBeInTheDocument();
});
```

`createTestInjectionScope` is for unit tests of logic in isolation. `<Injector>` is for full-tree component tests. The `<Injector>` overrides the token for the entire subtree. The real implementation is untouched outside.

## Async signals

`asyncState` and `fetchState` resolve on the microtask queue. Two helpers cover the common shapes.

`flushAsyncSignals()` — flushes two ticks (the function + the awaited promise). Enough for a function with one await:

```ts
import { flushAsyncSignals } from '@react-logic/core/testing';

class Logic { data = asyncState(async () => 'hello'); }

it('resolves async data', async () => {
  const t = createTestInjectionScope();
  const logic = t.build(Logic);

  expect(logic.data()).toBeUndefined();
  await flushAsyncSignals();
  expect(logic.data()).toBe('hello');

  t.dispose();
});
```

`flushAsyncSignalsUntil(getter)` — polls the getter until it returns a non-undefined value, then returns it. Good for multi-step functions or unknown depth:

```ts
import { flushAsyncSignalsUntil } from '@react-logic/core/testing';

class Logic {
  data = asyncState(async () => {
    const seed = await fetchSeed();
    return await enrich(seed);
  });
}

it('resolves a multi-step function', async () => {
  const t = createTestInjectionScope();
  const logic = t.build(Logic);

  const data = await flushAsyncSignalsUntil(() => logic.data());
  expect(data.id).toBe(42);

  t.dispose();
});
```

`flushAsyncSignalsUntil` throws if the getter is still `undefined` after 100 microtask flushes (configurable via `{ maxFlushes }`). Tests fail loudly instead of hanging.

For real-time delays (debounces, `setTimeout` in async functions), microtask flushing isn't enough. Use Vitest's fake timers or `findBy*` queries from testing-library.

Inside component tests, prefer `findBy*` queries. They retry until the assertion passes and handle async signals naturally without manual flushing.

## Testing lifecycle (`onDestroy`)

For component-level cleanup, unmount via testing-library:

```tsx
import { render } from '@testing-library/react';

it('cleans up the timer', () => {
  const { unmount } = render(<Clock />);
  // setInterval is running…
  unmount();
  // …it should be cleared. Verify via your timer mock or behavior.
});
```

For service-level cleanup, unmount the *Injector*, not just the consumer:

```tsx
const { rerender, unmount } = render(<Host show={true} />);
rerender(<Host show={false} />);    // consumer unmounts; service stays alive
unmount();                          // Injector unmounts; service onDestroy fires
```

For unit tests, the test scope's `dispose()` triggers `onDestroy`:

```ts
const cleanup = vi.fn();
class Service {
  constructor() { onDestroy(cleanup); }
}
class Logic { svc = inject(Service); }

it('cleans up the service', () => {
  const t = createTestInjectionScope([Service]);
  t.build(Logic);
  expect(cleanup).not.toHaveBeenCalled();
  t.dispose();
  expect(cleanup).toHaveBeenCalledOnce();
});
```

This is the test you write to catch leaks. Anything that should be cleaned up — timers, listeners, subscriptions — verify it actually is.

## Always dispose

Forgetting `t.dispose()` leaks state across tests. Services may persist on the root scope. Use `afterEach`:

```ts
let t: ReturnType<typeof createTestInjectionScope>;

beforeEach(() => {
  t = createTestInjectionScope([/* providers */]);
});
afterEach(() => {
  t.dispose();
});
```

## Adapter logs in test output

By default, `createTestInjectionScope` routes the adapter's construction logs ("Creating class instance for X", etc.) through `console.log` so they show up in test output. Useful for understanding which services constructed in what order when a test fails.

Disable per-call:

```ts
const t = createTestInjectionScope(providers, { log: false });
```

Or globally via env:

```sh
REACT_LOGIC_TEST_LOG=0 npm test
```

## What not to test

- **The framework itself.** `useLogic`, `<Injector>`, `inject`, and `onDestroy` are covered by the library's own test suite.
- **Signal mechanics** (computed caching, effect scheduling). Tested upstream by `alien-signals`.

Test *your* logic classes, *your* services' behavior, and the integration points between them.

## See also

- [Dependency injection](./dependency-injection) — how providers and scopes work in production.
- [Async state](./async-state) — what's being flushed when you call `flushAsyncSignals`.
