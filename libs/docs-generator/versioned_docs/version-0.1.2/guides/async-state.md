---
sidebar_position: 3
---

# Async state

`asyncState` is for values that come from a Promise and should re-run when the inputs change. It lives in the optional `@react-logic/utils` package:

```sh
npm install @react-logic/utils
```

For HTTP-specific cancellation, status, and adapters, see the [fetch state guide](./fetch-state). It's a separate helper with a richer state shape.

## The function

```ts
import { state } from '@react-logic/react-logic';
import { asyncState } from '@react-logic/utils';

class UserProfile {
  userId = state<string | null>(null);

  profile = asyncState(async () => {
    const id = this.userId();
    if (!id) return null;
    const res = await fetch(`/users/${id}`);
    return res.json();
  });
}
```

Any signal the async function reads becomes a dependency. When one changes, the function re-runs and the new resolved value replaces the old one.

Reading `profile()` returns:

- `undefined` until the first resolve completes,
- the resolved value after that,
- a new value whenever a tracked signal changes (the function re-runs).

The component reads it like any other signal:

```tsx
const Profile = () => {
  const logic = useLogic(UserProfile);
  const data = logic.profile();
  if (!data) return <p>Loading…</p>;
  return <h1>{data.name}</h1>;
};
```

## Loading + error states

`asyncState` only stores the *value*. Loading and error states live in extra signals you manage:

```ts
class UserProfile {
  userId = state<string | null>(null);
  loading = state(false);
  error = state<Error | null>(null);

  profile = asyncState(async () => {
    const id = this.userId();
    if (!id) return null;

    this.loading(true);
    this.error(null);
    try {
      const res = await fetch(`/users/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      this.error(e instanceof Error ? e : new Error(String(e)));
      return null;
    } finally {
      this.loading(false);
    }
  });
}
```

The component branches on the three signals:

```tsx
if (logic.loading()) return <Spinner />;
if (logic.error()) return <Error message={logic.error()!.message} />;
if (!logic.profile()) return null;
return <UserCard user={logic.profile()!} />;
```

If you write this pattern every time, you probably want [fetchState](./fetch-state). It bakes the loading/error machinery into a single state object.

## Race conditions

If a key changes before the previous fetch resolves, the older request can race the newer one and overwrite fresh data. Track the in-flight key and discard stale results:

```ts
profile = asyncState(async () => {
  const id = this.userId();        // captured synchronously, before any await
  if (!id) return null;
  const res = await fetch(`/users/${id}`);
  const data = await res.json();
  // If userId changed during the await, drop this result.
  if (this.userId() !== id) return this.profile();
  return data;
});
```

This returns the *previous* value when the result is stale, avoiding a flash of stale data on the way to the fresh result.

## Cancellation via AbortController

To actually abort the network request, hold an `AbortController` and cancel before each new run:

```ts
import { onDestroy } from '@react-logic/react-logic';

class UserProfile {
  userId = state<string | null>(null);
  private controller: AbortController | null = null;

  profile = asyncState(async () => {
    this.controller?.abort();
    this.controller = new AbortController();

    const id = this.userId();
    if (!id) return null;

    const res = await fetch(`/users/${id}`, { signal: this.controller.signal });
    return res.json();
  });

  constructor() {
    onDestroy(() => this.controller?.abort());
  }
}
```

If this is what you're doing, use [`fetchState`](./fetch-state). It wraps the boilerplate.

## Multiple keys

Reading more than one signal makes the function re-run when *any* of them change:

```ts
profile = asyncState(async () => {
  const id = this.userId();
  const lang = this.locale();
  if (!id) return null;
  return (await fetch(`/users/${id}?lang=${lang}`)).json();
});
```

Exactly what you want for "fetch when either input changes". No manual dependency arrays.

## When not to use asyncState

- **One-shot loads at construction time.** Just `await` directly in the constructor and write to a regular `state`. Simpler, no tracking overhead.
- **HTTP requests with cancellation, status, and error states.** Use [fetchState](./fetch-state). It handles this case with less boilerplate.
- **Mutations (POST/PUT/DELETE) you trigger from code.** Use [`fetchState.callable`](./fetch-state#fetchstatecallable--imperative). `asyncState` re-runs on signal changes, which is the wrong shape for a button click.
- **Caching, retries, optimistic updates.** Use a real data-fetching library (TanStack Query, SWR) and wrap it in a service if you want to inject it.

## See also

- [Fetch state](./fetch-state) — HTTP-specific helper with cancellation, status, pluggable transport, and a callable variant for mutations.
- [Reactive state](./reactive-state) — `effect` and `state`, the building blocks `asyncState` is built on.
- [Dependency injection](./dependency-injection) — moving async data into a service so multiple components share it.
