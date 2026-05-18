---
sidebar_position: 6
---

# Batch operations

When a method updates several signals in sequence, each write notifies subscribers — effects re-run, components re-render, computed values invalidate. Most of the time this is fine: writes happen synchronously and React's render boundary already coalesces them. But sometimes the intermediate states are incoherent (a form half-reset, a list with the old length but a new sort), or you're doing many writes in a loop, and you want one notification at the end. That's what `batch` is for.

## batch

```ts
import { batch, state } from '@react-logic/react-logic';

class Form {
  name = state('');
  email = state('');
  age = state(0);

  reset() {
    batch(() => {
      this.name('');
      this.email('');
      this.age(0);
    });
    // Subscribers fire once, with all three values reset, instead of
    // three times with partial intermediate states.
  }
}
```

Inside the `batch` callback, signal writes still happen synchronously — readers inside the callback see the new values. What's deferred is *notification*: effects, computeds, and component re-renders that subscribe to the written signals get notified once when the batch closes, with the final values.

`batch` forwards the callback's return value, so it composes with other expressions:

```ts
const newCount = batch(() => {
  this.count(this.count() + 1);
  this.history([...this.history(), this.count()]);
  return this.count();
});
```

## Why it usually doesn't matter

Inside a single synchronous event handler, the chain looks like:

1. Handler writes signal A → effect re-runs synchronously, computed A invalidates.
2. Handler writes signal B → effect re-runs again, computed B invalidates.
3. Handler returns → React commits the render with the latest values.

The DOM only updates once at step 3 regardless. So if all your subscribers are React components, the user sees a single visual update even without `batch` — React's commit phase is doing the coalescing for you.

`batch` matters when:

- An **effect** (not React render) does expensive or order-sensitive work and would see intermediate state. Persisting the whole form to localStorage on every field change, say.
- A **computed** would do expensive work on intermediate state. (Computeds are memoised, so usually fine — but if the cost of recomputing twice is high enough, batching avoids the middle recompute.)
- The writes are spread **across an async boundary** — React's render coalescing doesn't cross awaits. Two writes either side of `await fetch(…)` produce two renders.

## When `batch` matters most: cross-effect coordination

```ts
import { batch, effect, state } from '@react-logic/react-logic';

class Form {
  name = state('');
  email = state('');
  age = state(0);

  constructor() {
    effect(() => {
      // Expensive: persist to localStorage on every field change.
      localStorage.setItem('form', JSON.stringify({
        name: this.name(),
        email: this.email(),
        age: this.age(),
      }));
    });
  }

  reset() {
    batch(() => {
      this.name('');
      this.email('');
      this.age(0);
    });
    // The effect runs once with all three values reset, not three times
    // with partial intermediate states.
  }
}
```

Without `batch`: three writes, three effect runs, three `JSON.stringify` calls, three `localStorage.setItem`s.
With `batch`: one effect run, one persist.

## Nesting

`batch` uses a depth counter — only the outermost `batch` flushes. Inner batches are essentially no-ops on the notification side:

```ts
batch(() => {
  this.a(1);
  batch(() => {
    this.b(2);
  });
  // Subscribers haven't been notified yet — depth is still 1.
  this.c(3);
});
// Now they flush, once, with a=1, b=2, c=3.
```

This means helper methods can safely `batch` their internal writes without worrying about whether they're called from inside another batch — the outer one stays in control.

## Errors close the batch

```ts
batch(() => {
  this.a(1);
  throw new Error('boom');
});
// Subscribers still get notified with a=1.
// `batch` runs `endBatch()` in a `finally` so a thrown exception doesn't
// leave subscribers permanently paused.
```

## startBatch / endBatch — the raw primitives

`batch` is sugar for `startBatch()` / `endBatch()` paired in a `try`/`finally`. Both raw primitives are also exported, for cases where the batch needs to span control flow a single function can't wrap — opening in one event handler and closing in another, or threading through an external library that wants to call your code back.

```ts
import { startBatch, endBatch } from '@react-logic/react-logic';

class Dragger {
  x = state(0);
  y = state(0);

  startDrag() {
    startBatch();   // pause notifications for the duration of the drag
  }
  onMove(dx: number, dy: number) {
    this.x(this.x() + dx);
    this.y(this.y() + dy);
    // Subscribers don't fire on every mousemove.
  }
  endDrag() {
    endBatch();     // one notification with the final position
  }
}
```

The contract:

- Call `startBatch()` and `endBatch()` in **matched pairs**. Mismatched calls leave subscribers permanently paused (the depth counter never reaches zero).
- Always close in a `finally` if there's any chance the code between throws.
- Prefer `batch(fn)` whenever the work fits in a single callback. The raw primitives are an escape hatch, not a default.

## When not to batch

- Writes inside a single synchronous event handler. React's commit boundary already coalesces them visually.
- Writes that genuinely *should* notify between steps (animations, progressive states, anything where intermediate frames are the point).
- One-off writes. `batch(() => this.x(5))` is just `this.x(5)` with extra steps.

## See also

- [Reactive state](./reactive-state) — `effect`, `state`, the signal mechanics being coalesced.
- [Async state](./async-state) — the writes inside `asyncState`'s producer benefit from `batch` when you're updating several companion signals at once.
