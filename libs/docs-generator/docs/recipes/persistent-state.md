---
sidebar_position: 3
---

# Persistent state across hide/show

A logic class lives as long as its component is mounted. Toggle the component off — its state is gone.

## The problem

```tsx
class CounterPanelLogic {
  count = state(0);
  inc() { this.count(this.count() + 1); }
}

const CounterPanel = () => {
  const logic = useLogic(CounterPanelLogic);
  return (
    <div>
      <span>Count: {logic.count()}</span>
      <button onClick={() => logic.inc()}>+</button>
    </div>
  );
};

class PageLogic {
  visible = state(true);
  toggle() { this.visible(!this.visible()); }
}

const Page = () => {
  const page = useLogic(PageLogic);
  return (
    <>
      <button onClick={() => page.toggle()}>Toggle</button>
      {page.visible() && <CounterPanel />}
    </>
  );
};
```

Click +, +, +. Count is 3. Toggle off. Toggle on. Count is 0.

Toggling visibility unmounts `<CounterPanel>`. The unmount destroys the `CounterPanelLogic` instance — its signals, methods, everything. The next mount runs `useLogic` from scratch and gets a fresh instance with `count = 0`. The component owns the state, and the component just died.

## First attempt

Move the state to a class and inject it.

```tsx
import { inject } from '@react-logic/di';

class CounterStore {
  count = state(0);
  inc() { this.count(this.count() + 1); }
}

class CounterPanelLogic {
  store = inject(CounterStore);
  inc() { this.store.inc(); }
}

const CounterPanel = () => {
  const logic = useLogic(CounterPanelLogic);
  return (
    <div>
      <span>Count: {logic.store.count()}</span>
      <button onClick={() => logic.inc()}>+</button>
    </div>
  );
};
```

`Page` is unchanged. Click +, +, +. Toggle off. Toggle on. Count is 3.

The state moved to `CounterStore`, which `CounterPanelLogic` only *references*. When the component unmounts, only `CounterPanelLogic` is destroyed — `CounterStore` lives somewhere else. On remount, `inject(CounterStore)` returns the same instance, with `count = 3` intact.

## What happens with a second panel

```tsx
const Page = () => (
  <>
    <CounterPanel />
    <CounterPanel />
  </>
);
```

Click + on the left panel. The right panel jumps to 1 too.

There's exactly one `CounterStore` for the whole app. Both `CounterPanel`s inject the same instance, read the same `count` signal, and re-render together when it changes. Convenient for genuinely global state (the logged-in user, the active theme), wrong for "two independent counters."

## Scope it

```tsx
import { Injector } from '@react-logic/di';

const Page = () => (
  <>
    <Injector provide={[CounterStore]}>
      <CounterPanel />
    </Injector>
    <Injector provide={[CounterStore]}>
      <CounterPanel />
    </Injector>
  </>
);
```

Each panel has its own counter. Each survives toggling its own visibility. When `<Page>` unmounts, both stores go with it.

Each `<Injector>` creates its own scope. Listing `CounterStore` in `provide` tells that scope "construct a fresh `CounterStore` when something here asks for it." Two `<Injector>`s, two scopes, two stores. The store's lifetime is now bounded by its `<Injector>` — long enough to outlive the panel's mount cycles, short enough to die with the surrounding tree.

## Pick by situation

| Situation | Use |
|---|---|
| One state instance for the whole app | `inject(SomeStore)` directly. |
| State that should die when a feature/route closes | Wrap the feature in `<Injector provide={[Store]}>`. |
| Multiple independent instances on one page | An `<Injector>` per instance. |

Refactoring from the first form to the third doesn't change the consumer.

## What not to do

```tsx
class CounterPanelLogic {
  store = new CounterStore();   // recreated on every remount
}
```

The store has to be injected, not constructed in place.

## See also

- [Sharing services scoped to a tree](./scoped-services.md)
- [Concepts → Injectors](/docs/concepts/di-in-react/injectors)
- [Concepts → Providers](/docs/concepts/di-in-react/providers)
