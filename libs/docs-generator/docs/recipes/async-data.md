---
sidebar_position: 2
---

# Async data that re-fetches on a key change

`asyncState` runs a producer function inside an effect. Any signal the producer reads becomes a tracked dependency: when one changes, the producer re-runs and the value updates. This makes "re-fetch when the key changes" a one-liner.

## The basic shape

```ts
class UserProfileLogic {
  userId = state<string | null>(null);

  profile = asyncState(async () => {
    const id = this.userId();
    if (!id) return null;
    const res = await fetch(`/users/${id}`);
    return res.json();
  });
}
```

`profile()` returns:
- `undefined` until the first resolve completes,
- the resolved value afterwards,
- a new value whenever `userId` changes (the producer re-runs).

The component reads it directly:

```tsx
const Profile = () => {
  const logic = useLogic(UserProfileLogic);
  const data = logic.profile();
  if (!data) return <p>Loading…</p>;
  return <h1>{data.name}</h1>;
};
```

## Adding loading + error states

`asyncState` only models the *value*. Loading and error states live in companion signals you control:

```ts
class UserProfileLogic {
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

The component branches on the three states:

```tsx
if (logic.loading()) return <Spinner />;
if (logic.error()) return <Error message={logic.error()!.message} />;
if (!logic.profile()) return null;
return <UserCard user={logic.profile()!} />;
```

## Race conditions

If `userId` changes before the previous fetch resolves, you can end up showing stale data — the older request races the newer one. Track the in-flight key and discard out-of-date results:

```ts
class UserProfileLogic {
  userId = state<string | null>(null);

  profile = asyncState(async () => {
    const id = this.userId();           // captured before any await
    if (!id) return null;
    const res = await fetch(`/users/${id}`);
    const data = await res.json();
    // If the userId has changed during the await, drop this result.
    if (this.userId() !== id) return this.profile();
    return data;
  });
}
```

This pattern returns the *previous* value when superseded — preventing a flash of stale data.

For cancellation that actually aborts the request, hold an `AbortController` and cancel before each new run:

```ts
class UserProfileLogic {
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

This is exactly what you want for "fetch when either input changes" — no manual dependency arrays.

## When *not* to use asyncState

- For one-shot loads at construction time, you can `await` directly inside the constructor and write to a regular `state` — simpler.
- For data with complex caching, retries, optimistic updates, mutations — reach for a real data-fetching library (TanStack Query, SWR) and wrap it in a service if you want to inject it.

## See also

- [Recipes → Side effects driven by signals](./signal-effects.md) — when you want the side effect itself, not a value.
- [Concepts → Signals](/docs/concepts/signals) — `asyncState` in the model.
