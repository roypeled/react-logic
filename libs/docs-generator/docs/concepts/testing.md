---
sidebar_position: 4
---

# Testing

Logic classes are plain TypeScript classes — most of what you'd test is testable without React at all. Where React enters the picture (mount/unmount lifecycle, signal-driven re-renders), `@testing-library/react` handles it cleanly.

## Unit testing a logic class

Construct it directly, exercise it, assert.

```ts
import { describe, it, expect } from 'vitest';

class Counter {
  count = state(0);
  inc() { this.count(this.count() + 1); }
}

describe('Counter', () => {
  it('increments', () => {
    const c = new Counter();
    c.inc();
    expect(c.count()).toBe(1);
  });
});
```

No React, no `useLogic`, no `act()`. Signals are just functions; reads and writes are synchronous.

## Testing a logic class with injected services

If the logic class injects a service, you have two options:

**A. Use the test injection scope helper** — closest to production behavior:

```ts
import { createTestInjectionScope } from '@react-logic/core/testing';

const t = createTestInjectionScope([{ provide: Api, useClass: FakeApi }]);
const logic = t.build(MyLogic);
// …assert…
t.dispose();
```

Wraps the underlying adapter calls (`createScope` / `construct` / `disposeScope`) in one disposable handle. See [Recipes → Replacing services in tests](/docs/recipes/testing-mocks) for the full walkthrough including deep-nested overrides.

**B. Inject manually by swapping `inject()` at construction time** — quick and dirty, useful for tightly-scoped tests:

```ts
class MyLogic {
  api = inject(Api);
  // …
}

// In test:
const logic = Object.create(MyLogic.prototype);
logic.api = new FakeApi();
// …call methods directly…
```

Prefer A for anything non-trivial — it exercises the real DI lifecycle and catches `onDestroy` regressions.

## Testing a React component that uses useLogic

Wrap with `<Injector>` to provide test doubles, render with testing-library, drive interactions:

```tsx
import { render, screen } from '@testing-library/react';
import { Injector } from '@react-logic/di';

class FakeApi { fetch = vi.fn(() => Promise.resolve({ id: 1 })); }

it('shows the fetched data', async () => {
  render(
    <Injector provide={[{ provide: Api, useClass: FakeApi }]}>
      <ProductPanel />
    </Injector>
  );
  expect(await screen.findByText(/product 1/i)).toBeInTheDocument();
});
```

The `<Injector>` overrides `Api` for the entire subtree; the real implementation is untouched.

## Testing lifecycle (onDestroy)

The cleanest way to test `onDestroy` is via `act` and `unmount`:

```tsx
import { render, act } from '@testing-library/react';

it('cleans up the timer', () => {
  const { unmount } = render(<Clock />);
  // setInterval is running…
  unmount();
  // …it should be cleared. Verify via your timer mock or behavior.
});
```

For service-level `onDestroy`, unmount the *Injector*, not just the consumer:

```tsx
const { rerender, unmount } = render(<Host show={true} />);
rerender(<Host show={false} />);    // consumer unmounts; service stays alive
unmount();                          // Injector unmounts; service onDestroy fires
```

## Testing async signals

`asyncState` resolves on the microtask queue. Two helpers, depending on the chain depth:

- `flushAsyncSignals()` — flushes two ticks (producer + awaited promise). Good for single-await producers.
- `flushAsyncSignalsUntil(read)` — polls until the read returns non-undefined, then returns the value. Good when the producer awaits multiple steps or you don't want to count ticks.

```ts
import { flushAsyncSignals, flushAsyncSignalsUntil } from '@react-logic/core/testing';

// Single-await:
logic.userId('42');
await flushAsyncSignals();
expect(logic.profile()).toEqual({ id: '42', name: '...' });

// Multi-step or unknown depth:
logic.userId('42');
const profile = await flushAsyncSignalsUntil(() => logic.profile());
expect(profile.id).toBe('42');
```

Inside `@testing-library/react` tests, prefer `findBy*` queries — they retry until the assertion passes, and handle async signals naturally.

## What not to test

- The framework itself. `useLogic`, `<Injector>`, `inject`, `onDestroy` are covered by the lib's own test suite. Re-testing them in your project is noise.
- Signal mechanics (computed memoisation, effect scheduling). Tested upstream by `alien-signals`.

Test *your* logic classes, *your* services' behavior, and the integration points between them and the components that use them.
