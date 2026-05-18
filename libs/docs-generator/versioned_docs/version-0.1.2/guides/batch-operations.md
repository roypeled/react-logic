---
sidebar_position: 6
---

# Batch operations

When a method updates several signals in sequence, each write triggers an update: effects re-run, components re-render, computed values invalidate. Usually that's fine. Writes happen synchronously, and React's render boundary already combines them. But sometimes the intermediate states are inconsistent (a form half-reset, a list with the old length but a new sort), or you're doing many writes in a loop and want one update at the end. That's what `batch` is for.

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
    // One update fires with all three values reset, instead of
    // three updates with partial intermediate states.
  }
}
```

Inside the `batch` callback, signal writes still happen synchronously. Reads inside the callback see the new values. What's deferred is the *update*: effects, computeds, and component re-renders that read the written signals get one update when the batch closes, with the final values.

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

The DOM only updates once at step 3 either way. So if all your readers are React components, the user sees a single visual update even without `batch`. React's commit phase is doing the combining for you.

`batch` matters when:

- An **effect** (not React render) does expensive or order-sensitive work and would see intermediate state. For example, persisting the whole form to localStorage on every field change.
- A **computed** would do expensive work on intermediate state. (Computeds are cached, so usually fine, but if the cost of recomputing twice is high enough, batching avoids the middle recompute.)
- The writes are spread **across an async boundary**. React's render combining doesn't cross awaits. Two writes on either side of `await fetch(…)` produce two renders.

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

`batch` uses a depth counter. Only the outermost `batch` flushes. Inner batches don't trigger an update on their own:

```ts
batch(() => {
  this.a(1);
  batch(() => {
    this.b(2);
  });
  // No update has fired yet — depth is still 1.
  this.c(3);
});
// Now they flush, once, with a=1, b=2, c=3.
```

This means helper methods can safely `batch` their internal writes without worrying about whether they're called from inside another batch. The outer one stays in control.

## Errors close the batch

```ts
batch(() => {
  this.a(1);
  throw new Error('boom');
});
// Readers still get the update with a=1.
// `batch` runs `endBatch()` in a `finally`, so a thrown exception doesn't
// leave updates permanently paused.
```

## startBatch / endBatch — the low-level API

`batch` is shorthand for `startBatch()` and `endBatch()` paired in a `try`/`finally`. Both are also exported directly, for cases where the batch needs to span code a single function can't wrap: opening in one event handler and closing in another, or threading through an external library that calls your code back.

```ts
import { startBatch, endBatch } from '@react-logic/react-logic';

class Dragger {
  x = state(0);
  y = state(0);

  startDrag() {
    startBatch();   // pause updates for the duration of the drag
  }
  onMove(dx: number, dy: number) {
    this.x(this.x() + dx);
    this.y(this.y() + dy);
    // No update fires on every mousemove.
  }
  endDrag() {
    endBatch();     // one update with the final position
  }
}
```

The contract:

- Call `startBatch()` and `endBatch()` in **matched pairs**. Mismatched calls leave updates permanently paused (the depth counter never reaches zero).
- Always close in a `finally` if there's any chance the code in between throws.
- Prefer `batch(fn)` whenever the work fits in a single callback. The low-level API is an escape hatch, not a default.

## When not to batch

- Writes inside a single synchronous event handler. React's commit boundary already combines them visually.
- Writes that *should* trigger an update between steps (animations, progressive states, anything where intermediate frames are the point).
- One-off writes. `batch(() => this.x(5))` is just `this.x(5)` with extra steps.

## See also

- [Reactive state](./reactive-state) — `effect` and `state`, the signal mechanics being combined.
- [Async state](./async-state) — writes inside `asyncState`'s function benefit from `batch` when you're updating several related signals at once.
