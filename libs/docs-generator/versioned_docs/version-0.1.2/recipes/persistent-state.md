---
sidebar_position: 2
---

# Persistent state across hide/show

State that survives a component being toggled off and back on. Move it into a service. The component just references it.

```tsx
import { inject, useLogic, state, Injector } from '@react-logic/react-logic';

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

Toggle off, then on, and the count is preserved. The store outlives the panel's mount cycles.

## Multiple independent instances

```tsx
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

Each `<Injector>` scopes its own `CounterStore`. Each panel has an independent counter that survives its own visibility toggles. Both are disposed when `<Page>` unmounts.

## See also

- [Sharing services scoped to a tree](./scoped-services.md)
- [Dependency injection guide](/docs/guides/dependency-injection)
