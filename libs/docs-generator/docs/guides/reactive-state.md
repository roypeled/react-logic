---
sidebar_position: 2
---

# Reactive state

The signal model in depth: how `state`, `computedState`, and `effect` work, when to use each one, the input variant of `computedState`, how dependency tracking and disposal happen automatically, and the `onDestroy` escape hatch for resources signals don't own.

For the high-level mental model (what is a signal, why the API looks this way, the function table), see [Concepts → Signals](/docs/concepts/signals).

## state

```ts
import { state } from '@react-logic/react-logic';

const count = state(0);
count();    // 0   — read
count(5);   // void — write
count();    // 5
```

A `state()` is a single function that's both getter and setter. Call it with zero arguments to read. Call it with one argument to write. Reads return `T`; writes return `void`.

On a logic-class field, `useLogic` finds the signal, reads it during a tracking pass, and subscribes the component to it. Later writes re-render the component without any React state plumbing.

```ts
class Counter {
  count = state(0);
  inc() { this.count(this.count() + 1); }
}
```

### Identity matters

Signals compare with `===`. **A signal only fires an update when the new value is a different reference from the old one.** That's intentional: it makes "did the value change?" the same question as "did the reference change?", which matches how JavaScript compares things by default.

For primitives (numbers, strings, booleans) this is invisible — every write is a fresh value:

```ts
const count = state(0);
count(1);   // updates: 0 → 1
count(1);   // no update: same value
count(2);   // updates: 1 → 2
```

For objects and arrays, mutating in place does **not** trigger an update, because the reference didn't change:

```ts
const todos = state<string[]>([]);
const list = todos();

list.push('buy milk');   // mutates in place
todos(list);             // ❌ same reference — no update
```

Write a new reference instead:

```ts
todos([...todos(), 'buy milk']);   // ✅ new array — update fires
```

The same applies to objects: spread (`{ ...obj, name: 'x' }`) rather than `obj.name = 'x'`. This is the same discipline React's `setState` requires for the same reason.

## computedState

`computedState(fn)` runs `fn` the first time it's read and caches the result. It re-runs only when a signal it depends on changes, and even then, anything reading it only updates if the result actually changed. Chains of computeds are cheap.

```ts
class Cart {
  items = state<Item[]>([]);
  total = computedState(() =>
    this.items().reduce((sum, i) => sum + i.price, 0)
  );
  isEmpty = computedState(() => this.items().length === 0);
}
```

Reading `cart.total()` runs the reducer once. Reading it again returns the cached value with no work. Pushing an item triggers a recompute. Pushing a second item with the same total (a free sample, for example) recomputes but doesn't trigger an update. The cached result is equal.

### Input variant

If the function takes an argument, `computedState` creates an internal signal to hold that input. The returned function then doubles as a setter:

```ts
class Search {
  pattern = computedState((q = '') => new RegExp(q, 'i'));
}

const s = new Search();
s.pattern('foo');  // void — writes the input
s.pattern();       // RegExp(/foo/i) — reads the derived value
```

The default-argument syntax `(q = '') => …` does two things: it seeds the first read (the internal signal starts as `undefined`, so the default kicks in), and it narrows the input type from `string | undefined` to `string`.

Without a default argument, the input is `T | undefined` and the function must handle it:

```ts
pattern = computedState((q: string | undefined) =>
  q ? new RegExp(q, 'i') : null
);
```

A plain `(q: string) => …` (no default, no `| undefined`) is a TypeScript error. The runtime would otherwise crash on the first read.

Use the input variant when a derived value depends on a single piece of state nothing else needs to read. The alternative — a separate `state` field plus a `computedState` — works the same but uses two fields where one would do.

## effect

Sometimes there's no value to expose. You just want a side effect that runs when its inputs change: logging, persisting, calling an analytics endpoint, syncing to an external system. Use `effect`.

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

`effect` runs the body once immediately, tracks which signals it read, and re-runs whenever any of them change. This is the same mechanism that powers `useLogic`'s render tracking. You're using it directly when the outcome is a side effect rather than a value.

### Auto-disposal

`useLogic` wraps the constructor in a tracking scope, so `effect()` calls inside the logic-class constructor (or inside services constructed via DI) are disposed automatically when their owning scope tears down:

- Logic-class effects: cleaned up on component unmount.
- Service effects: cleaned up on `<Injector>` unmount (not when the consumer unmounts).

You don't capture the stop function or call `onDestroy` for these. The framework handles it.

### Cleanup return

The effect body can return a cleanup function — same shape as React's `useEffect`. It runs:

- Before each re-run, tied to the previous run.
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

If a signal the effect reads changes, the cleanup fires before the next run. This is useful when each re-run sets up a fresh resource that the previous run owned (a debounced timer, a subscription keyed off a query).

### Conditional tracking

Tracking is per-run, not per-effect. Reads inside a branch that didn't execute don't subscribe:

```ts
effect(() => {
  if (!this.enabled()) return;
  // Only tracks `payload` while enabled is true.
  sendToServer(this.payload());
});
```

Toggling `enabled` to `true` starts tracking `payload`. Back to `false` and the next run skips it.

### Anti-patterns

**Writing back to a signal you read.** The effect re-triggers itself forever:

```ts
// Don't.
effect(() => {
  this.count(this.count() + 1);
});
```

If you find yourself reaching for this, you want `computedState` (to derive from inputs) or a separate signal the effect writes to without reading.

**Reads inside async callbacks aren't tracked.** Tracking ends when the effect body returns:

```ts
effect(() => {
  setTimeout(() => this.x(), 100);   // x is NOT tracked
});
```

Read everything you need synchronously, store it in local variables, then use those in the async callback.

**Effects in methods.** A method called once doesn't set up reactive tracking. Effects belong in the constructor (or in field initializers that run during construction).

## onDestroy — for the things signals don't own

Anything signal-driven (`state`, `computedState`, `effect`, `asyncState`) is cleaned up automatically. Anything else — `setInterval`, DOM event listeners on `document` or `window`, websockets, third-party SDK handles — needs to register its teardown explicitly with `onDestroy`.

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

This is **not** a React effect cleanup. It runs when the owning scope is disposed, based on *where the construction happened*, not on component re-renders. If a service holds a resource and a sibling component unmounts, the service's `onDestroy` does **not** fire. The service is still alive on the surrounding `<Injector>`.

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

Remove the listener, then close the socket — in the order they were registered.

### Errors during cleanup

If a registered callback throws, the framework catches and logs the error, then continues running the rest. One bad teardown doesn't block the others. This matters when you have several resources and want everything cleaned up regardless.

### Gotchas

- **`onDestroy` outside a constructor throws.** Register everything during construction. Lazy registration (for example, in a method called later) has no active scope to attach to.
- **Don't use `onDestroy` for signal effects.** `effect()` and `asyncState()` are cleaned up automatically. `onDestroy` is for the things they don't cover.

## effect vs computedState — choosing

`computedState` returns a value. `effect` returns nothing. The choice depends on what reads the result:

- A value that *other* logic reads → `computedState`.
- An action whose only purpose is its side effect → `effect`.

Don't use `effect` to compute a value and stash it in a signal. That's an anti-pattern. `computedState` is built for that case and caches the result for free.

## See also

- [Async state](./async-state) — when the function is async and you want to refetch on key change.
- [Batch operations](./batch-operations) — combining multiple writes into one update.
- [Dependency injection](./dependency-injection) — what "scope" means for `onDestroy` and service-side effects.
