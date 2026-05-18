---
sidebar_position: 3
---

# Async state

`asyncState` models values that come from a Promise but should re-run when the inputs change. Lives in the optional `@react-logic/utils` package:

```sh
npm install @react-logic/utils
```

For the HTTP-specific cancellation + status + adapter story, see the [fetch state guide](./fetch-state) — it's a separate helper with a richer state shape.

## The producer

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

`asyncState(fn)` runs `fn` inside an effect. Any signal the producer reads becomes a tracked dependency. When one changes, the producer re-runs and the resolved value notifies subscribers.

Reading `profile()` returns:

- `undefined` until the first resolve completes,
- the resolved value afterwards,
- a new value whenever a tracked signal changes (the producer re-runs).

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

`asyncState` only models the *value*. Loading and error states live in companion signals you control:

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

If you're writing this pattern *every* time, you probably want [fetchState](./fetch-state) — it bakes the loading/error machinery into a single discriminated state.

## Race conditions

If a key changes before the previous fetch resolves, the older request can race the newer one and overwrite fresh data. Track the in-flight key and discard out-of-date results:

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

This returns the *previous* value when superseded, avoiding a flash of stale data on the way to the fresh result.

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

If this pattern is *the* thing you're doing, use [`fetchState`](./fetch-state) — it wraps the boilerplate.

## Multiple keys

Reading more than one signal makes the producer re-run when *any* of them change:

```ts
profile = asyncState(async () => {
  const id = this.userId();
  const lang = this.locale();
  if (!id) return null;
  return (await fetch(`/users/${id}?lang=${lang}`)).json();
});
```

Exactly what you want for "fetch when either input changes" — no manual dependency arrays.

## When not to use asyncState

- **One-shot loads at construction time.** Just `await` directly in the constructor and write to a regular `state` — simpler, no tracking overhead.
- **HTTP requests with cancellation + status + error states.** Use [fetchState](./fetch-state) — it solves this specific shape with less boilerplate.
- **Mutations (POST/PUT/DELETE) you trigger imperatively.** Use [`fetchState.callable`](./fetch-state#fetchstatecallable--imperative) — `asyncState` re-runs on signal changes, which is the wrong shape for a button click.
- **Caching, retries, optimistic updates.** Use a real data-fetching library (TanStack Query, SWR) and wrap it in a service if you want to inject it.

## See also

- [Fetch state](./fetch-state) — HTTP-specific helper with cancellation, status, pluggable transport, and a callable variant for mutations.
- [Reactive state](./reactive-state) — `effect`, `state`, the primitives `asyncState` sits on top of.
- [Dependency injection](./dependency-injection) — hoisting async data into a service so multiple components share it.
