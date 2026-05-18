---
sidebar_position: 7
---

# Cleanup for non-signal resources

Anything signal-driven (`state`, `computedState`, `asyncState`, `effect()`) gets cleaned up automatically. Anything else — `setInterval`, DOM event listeners, websockets, third-party SDK handles — needs to register its teardown explicitly with `onDestroy`.

## The pattern

```ts
import { onDestroy } from '@react-logic/di';

class Clock {
  now = state(Date.now());

  constructor() {
    const id = setInterval(() => this.now(Date.now()), 1000);
    onDestroy(() => clearInterval(id));
  }
}
```

`onDestroy(fn)` registers `fn` for the surrounding construction's teardown. For a logic class constructed by `useLogic`, that's component unmount. For a service constructed via DI, it's `<Injector>` unmount.

## What `onDestroy` is *not*

It's not a React effect cleanup. It runs when the **owning scope** is disposed — which is determined by where the construction happened, not by component re-renders.

- Logic class lifetime = component lifetime.
- Service lifetime = `<Injector>` lifetime.

If a service holds a resource and a sibling component unmounts, the service's `onDestroy` does **not** fire — the service is still alive on the surrounding `<Injector>`.

## Multiple teardowns

You can call `onDestroy` more than once. They run in registration order (FIFO):

```ts
class Connector {
  socket = new WebSocket('wss://...');
  constructor() {
    const handler = () => console.log('message');
    this.socket.addEventListener('message', handler);

    onDestroy(() => this.socket.removeEventListener('message', handler));
    onDestroy(() => this.socket.close());
  }
}
```

On disposal: remove the listener, then close the socket — same order they were registered.

## DOM listeners on document/window

```ts
class GlobalShortcuts {
  constructor() {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.cancel();
    };
    document.addEventListener('keydown', handler);
    onDestroy(() => document.removeEventListener('keydown', handler));
  }

  cancel() { /* … */ }
}
```

This is the single most common reason to use `onDestroy` directly — listeners attached to objects outside React's tree won't be cleaned up by anything else.

## ResizeObserver / IntersectionObserver

```ts
class VisibilityTracker {
  visible = state(false);

  constructor() {
    const observer = new IntersectionObserver((entries) => {
      this.visible(entries[0].isIntersecting);
    });
    // …observe an element somewhere…
    onDestroy(() => observer.disconnect());
  }
}
```

## Third-party SDK handles

Anything with an explicit `dispose`/`destroy`/`unsubscribe`/`close` method gets the same treatment:

```ts
class ChartLogic {
  constructor() {
    const chart = ThirdPartyLib.create({ /* … */ });
    onDestroy(() => chart.dispose());
  }
}
```

## Errors during cleanup

If a registered callback throws, the framework catches and logs the error then continues running the rest. One bad teardown won't block the others — important for compounded resources where you want everything cleaned up regardless.

## When `onDestroy` fires from where

| Context | Cleanup runs when |
|---|---|
| Logic class constructor (used via `useLogic`) | Component unmounts |
| Service constructor (resolved via `inject()`) | Providing `<Injector>` unmounts |
| Auto-registered class on the root scope | HMR cycle (dev) or process termination (prod) |

That last row is why HMR matters: a service that holds a `setInterval` will keep ticking through every dev reload unless the global scope is reset. The bundler-specific HMR installers (`installViteHMR`, `installWebpackHMR`, `installParcelHMR`) hook this up — see the API reference.

## Don't forget the field-initializer trick

A common style is to put the cleanup capture on a class field instead of in the constructor body:

```ts
class Clock {
  now = state(Date.now());
  // Field initializers run during construction, so onDestroy is in scope.
  private cleanup = (() => {
    const id = setInterval(() => this.now(Date.now()), 1000);
    onDestroy(() => clearInterval(id));
  })();
}
```

Either style works — pick whichever you find more readable. The constructor-body version is usually clearer.

## Gotchas

- **Calling `onDestroy` outside a constructor.** Calling it from a method or a lazy code path will throw — there's no active construction context to register against. Register everything during construction.
- **Capturing `this` after the construction frame.** `onDestroy(() => this.thing.dispose())` is fine — the arrow closes over `this`. But `onDestroy(() => closeWith(this.thing))` evaluated lazily during construction is fine too. The pitfall is only if you tried to *defer* the registration itself; do that, and the construction context is gone.
- **Using onDestroy for signal effects.** Don't. `effect()` and `asyncState()` are auto-cleaned. `onDestroy` is for the things they don't cover.

## See also

- [Side effects driven by signals](./signal-effects.md) — the auto-cleanup case.
- [Concepts → DI in React](/docs/concepts/di-in-react/) — what "scope" means and where boundaries live.
