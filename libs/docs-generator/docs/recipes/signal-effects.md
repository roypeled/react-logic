---
sidebar_position: 6
---

# Side effects driven by signals

Sometimes you don't want a derived *value* — you want a *side effect* that runs when its inputs change. Logging, persisting to localStorage, calling an analytics endpoint, syncing to an external system. Reach for `effect()` from `@react-logic/state`.

## The pattern

```ts
import { effect, state } from '@react-logic/state';

class FilterLogic {
  query = state('');
  page = state(1);

  constructor() {
    effect(() => {
      console.log('search:', this.query(), 'page:', this.page());
    });
  }
}
```

`effect` runs the body once immediately, tracking which signals it reads. Whenever any of those signals change, it re-runs. This is the same primitive that powers `useLogic`'s render-tracking — you're using it directly when you want a side-effect-only outcome.

## Auto-disposal

`useLogic` wraps the constructor in a tracking scope, so `effect()` calls inside the logic-class constructor (or services constructed via DI) are automatically disposed when the owning scope tears down:

- Logic-class effects → cleaned up on component unmount.
- Service effects → cleaned up on `<Injector>` unmount (not consumer unmount).

You don't need to capture the stop function or call `onDestroy` for these — the framework handles it.

## Cleanup callback

The effect body may return a cleanup function — same shape as React's `useEffect`. It runs:

- Before each subsequent re-run, scoped to the previous invocation's deps.
- On final teardown (component unmount, `<Injector>` unmount, or manual stop).

```ts
class WindowSize {
  width = state(window.innerWidth);
  height = state(window.innerHeight);
  constructor() {
    effect(() => {
      const handler = () => {
        this.width(window.innerWidth);
        this.height(window.innerHeight);
      };
      window.addEventListener('resize', handler);
      return () => window.removeEventListener('resize', handler);
    });
  }
}
```

The listener is added on first run and removed on teardown. If a signal the effect reads changes, the cleanup fires before the next run — useful when each re-run sets up a fresh resource that the previous run owned.

For non-signal resources tied to the construction itself (not the effect), `onDestroy` is still the right tool. See [Cleanup for non-signal resources](./cleanup.md).

## When to use effect vs computedState

`computedState` returns a value; `effect` returns nothing. The choice is about consumption:

- A value that *other* logic reads → `computedState`.
- An action whose only purpose is its side effect → `effect`.

Don't use `effect` to compute a value and stash it in a signal — that's an `effect`-of-set anti-pattern. `computedState` is built for that case.

## Persisting to localStorage

A common use:

```ts
class Preferences {
  theme = state(localStorage.getItem('theme') ?? 'light');
  fontSize = state(parseInt(localStorage.getItem('fontSize') ?? '14', 10));

  constructor() {
    effect(() => localStorage.setItem('theme', this.theme()));
    effect(() => localStorage.setItem('fontSize', String(this.fontSize())));
  }
}
```

Two effects, one per signal — change the theme, only the theme write fires. Each effect tracks its own dependencies independently.

## Conditional effects

The body of `effect` runs synchronously each time. Branching is fine — only the signals you actually read inside the chosen branch are tracked:

```ts
class Sync {
  enabled = state(false);
  payload = state('');
  constructor() {
    effect(() => {
      if (!this.enabled()) return;
      // Only tracks `payload` while enabled is true.
      sendToServer(this.payload());
    });
  }
}
```

Toggling `enabled` from false → true now starts tracking `payload`; switching back to false stops. Conditional dependency tracking is automatic.

## Triggering an effect with a debounce

Effects fire synchronously. For network or expensive work, wrap with a debounce — the cleanup callback handles both the in-flight timer and the per-rerun cancellation:

```ts
class Search {
  query = state('');
  private results = state<Hit[]>([]);

  constructor() {
    effect(() => {
      const q = this.query();
      const timer = setTimeout(async () => {
        this.results(await search(q));
      }, 300);
      return () => clearTimeout(timer);
    });
  }

  hits = () => this.results();
}
```

Each time `query` changes the cleanup fires before the next run, cancelling the pending timer. On unmount the framework calls the latest cleanup, so an in-flight timer never outlives the component.

Or — usually simpler — model it as `asyncState` with the producer doing the debounce. See [Async data that re-fetches on a key change](./async-data.md).

## Don't write back to signals you read

```ts
// Anti-pattern.
effect(() => {
  this.count(this.count() + 1);   // re-triggers itself forever
});
```

`effect` re-runs whenever a signal it read changes. Writing back to that signal triggers another run — infinite loop. If you find yourself reaching for this, you probably want `computedState` (read multiple, derive one) or a separate signal that the effect writes to without reading.

## Gotchas

- **Don't put effects in methods.** A method called once doesn't establish reactive tracking. Effects belong in the constructor (or in field initializers).
- **Don't share effect scope across logic classes manually.** The framework handles scoping. Creating an `effectScope` yourself usually means you're working against the framework's tracking — re-think the design instead.
- **Reads inside async callbacks aren't tracked.** `effect(() => { setTimeout(() => this.x(), 100); })` doesn't track `x` — by the time the callback fires, the tracking phase has ended. Read everything you need synchronously before any await/timeout, then use the captured values.

## See also

- [Cleanup for non-signal resources](./cleanup.md) — `onDestroy` for things effects don't auto-handle.
- [Async data that re-fetches on a key change](./async-data.md) — when the side effect produces a value.
- [Concepts → Signals](/docs/concepts/signals) — the underlying model.
