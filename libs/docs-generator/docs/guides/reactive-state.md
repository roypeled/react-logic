---
sidebar_position: 2
---

# Reactive state

The signal model in depth: how `state`, `computedState`, and `effect` work, when each is the right tool, the input-variant of `computedState`, automatic dependency tracking and disposal, and the `onDestroy` escape hatch for resources signals don't own.

For the high-level mental model (what is a signal, why this shape, the primitives table), see [Concepts → Signals](/docs/concepts/signals).

## state

```ts
import { state } from '@react-logic/react-logic';

const count = state(0);
count();    // 0   — read
count(5);   // void — write
count();    // 5
```

A `state()` is a single function that's both getter and setter. Calling with zero arguments reads; calling with one argument writes. The return values are different — reads give `T`, writes give `void` — so a stray `count(5)` instead of `count(count() + 1)` shows up at compile time.

On a logic-class field, `useLogic` finds the signal, calls it during a tracking pass, and subscribes the component to it. Subsequent writes re-render the component without any React state plumbing.

```ts
class Counter {
  count = state(0);
  inc() { this.count(this.count() + 1); }
}
```

Identity matters: `count(items)` then `count(items)` with the **same array reference** does not notify subscribers. If you need to mutate-in-place, write a new reference (`count([...items, next])`). This is intentional — it makes "did the value change" the same question as "did the reference change," which is what JS comparison semantics give you for free.

## computedState

`computedState(fn)` runs `fn` on first read and caches the result. It re-runs only when a signal it depends on changes, and even then, subscribers fire only if the *output* changed. Chains of computeds are cheap.

```ts
class Cart {
  items = state<Item[]>([]);
  total = computedState(() =>
    this.items().reduce((sum, i) => sum + i.price, 0)
  );
  isEmpty = computedState(() => this.items().length === 0);
}
```

Reading `cart.total()` runs the reducer once. Reading it again returns the cached value with no work. Pushing an item triggers a recompute. Pushing a second item with the same total (e.g. a free sample) recomputes but doesn't re-notify — the cached output is equal.

### Input variant

If the compute callback takes an argument, `computedState` wraps an internal signal as the input. The returned function then doubles as a setter:

```ts
class Search {
  pattern = computedState((q = '') => new RegExp(q, 'i'));
}

const s = new Search();
s.pattern('foo');  // void — writes the input
s.pattern();       // RegExp(/foo/i) — reads the derived value
```

The default-arg syntax `(q = '') => …` does two things: it seeds the first read (the wrapped signal starts as `undefined` — the default kicks in) and it narrows the input type from `string | undefined` to `string`.

Without a default arg, the input is `T | undefined` and the callback must handle it:

```ts
pattern = computedState((q: string | undefined) =>
  q ? new RegExp(q, 'i') : null
);
```

A bare `(q: string) => …` (no default, no `| undefined`) is a TypeScript error — the runtime would otherwise crash on the first read.

Use the input variant when a derived value is keyed off a single piece of state that nothing else needs to read. The alternative — a separate `state` field plus a `computedState` — works the same but spreads two related fields where one would do.

## effect

Sometimes there's no value to expose; you just want a side effect that runs when its inputs change. Logging, persisting, calling an analytics endpoint, syncing to an external system. Use `effect`.

```ts
import { effect } from '@react-logic/react-logic';

class Logger {
  count = state(0);
  constructor() {
    effect(() => {
      console.log('count =', this.count());
    });
  }
}
```

`effect` runs the body once immediately, tracks which signals were read, and re-runs whenever any of them change. This is the same primitive that powers `useLogic`'s render-tracking — you're using it directly when the outcome is a side effect rather than a value.

### Auto-disposal

`useLogic` wraps the constructor in a tracking scope, so `effect()` calls inside the logic-class constructor (or services constructed via DI) are disposed automatically when their owning scope tears down:

- Logic-class effects → cleaned up on component unmount.
- Service effects → cleaned up on `<Injector>` unmount (not consumer unmount).

You don't capture the stop function or call `onDestroy` for these — the framework handles it.

### Cleanup return

The effect body may return a cleanup function — same shape as React's `useEffect`. It runs:

- Before each subsequent re-run, scoped to the previous invocation's deps.
- On final teardown.

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

If a signal the effect reads changes, the cleanup fires before the next run — useful when each re-run sets up a fresh resource that the previous run owned (a debounced timer, a subscription keyed off a query).

### Conditional tracking

Tracking is per-run, not per-effect. Reads inside an unreached branch don't subscribe:

```ts
effect(() => {
  if (!this.enabled()) return;
  // Only tracks `payload` while enabled is true.
  sendToServer(this.payload());
});
```

Toggling `enabled` to `true` starts tracking `payload`; back to `false` and the next run skips it.

### Anti-patterns

**Writing back to a signal you read** — the effect re-triggers itself forever:

```ts
// Don't.
effect(() => {
  this.count(this.count() + 1);
});
```

If you find yourself reaching for this, you want `computedState` (derive from inputs) or a separate signal the effect writes to without reading.

**Reads inside async callbacks aren't tracked.** The tracking phase ends synchronously with the effect body:

```ts
effect(() => {
  setTimeout(() => this.x(), 100);   // x is NOT tracked
});
```

Read everything you need synchronously, capture into locals, then use the locals in the async callback.

**Effects in methods.** A method called once doesn't establish reactive tracking. Effects belong in the constructor (or in field initializers that run during construction).

## onDestroy — for the things signals don't own

Anything signal-driven (`state`, `computedState`, `effect`, `asyncState`) is cleaned up automatically. Anything else — `setInterval`, DOM event listeners on `document`/`window`, websockets, third-party SDK handles — needs to register its teardown explicitly with `onDestroy`.

```ts
import { onDestroy } from '@react-logic/react-logic';

class Clock {
  now = state(Date.now());

  constructor() {
    const id = setInterval(() => this.now(Date.now()), 1000);
    onDestroy(() => clearInterval(id));
  }
}
```

`onDestroy(fn)` registers `fn` for the surrounding construction's teardown.

| Context | Cleanup runs when |
|---|---|
| Logic class (constructed by `useLogic`) | Component unmounts |
| Service (resolved via `inject()`) | Providing `<Injector>` unmounts |

It is **not** a React effect cleanup. It runs when the owning scope is disposed — determined by *where the construction happened*, not by component re-renders. If a service holds a resource and a sibling component unmounts, the service's `onDestroy` does **not** fire — the service is still alive on the surrounding `<Injector>`.

### Multiple teardowns

You can call `onDestroy` more than once. They run in registration order (FIFO):

```ts
class Connector {
  socket = new WebSocket('wss://…');
  constructor() {
    const handler = () => console.log('message');
    this.socket.addEventListener('message', handler);

    onDestroy(() => this.socket.removeEventListener('message', handler));
    onDestroy(() => this.socket.close());
  }
}
```

Remove the listener, then close the socket — same order they were registered.

### Errors during cleanup

If a registered callback throws, the framework catches and logs the error, then continues running the rest. One bad teardown doesn't block the others — important for compounded resources where you want everything cleaned up regardless.

### Gotchas

- **`onDestroy` outside a constructor throws.** Register everything during construction. Lazy registration (e.g. in a method called later) has no active scope to attach to.
- **Don't use `onDestroy` for signal effects.** `effect()` and `asyncState()` are auto-cleaned. `onDestroy` is for the things they don't cover.

## effect vs computedState — choosing

`computedState` returns a value; `effect` returns nothing. The choice is about consumption:

- A value that *other* logic reads → `computedState`.
- An action whose only purpose is its side effect → `effect`.

Don't use `effect` to compute a value and stash it in a signal — that's an `effect`-of-set anti-pattern. `computedState` is built for that case and gets memoisation for free.

## See also

- [Async state](./async-state) — when the producer is async and you want re-fetch-on-key-change.
- [Batch operations](./batch-operations) — coalescing multiple writes into one notification.
- [Dependency injection](./dependency-injection) — what "scope" means for `onDestroy` and service-side effects.
