# React Logic

A tiny React toolkit that cleanly separates component render from component logic using signals and dependency injection (DI).

- One logic instance per component (no re-renders in the logic itself)
- Signals drive UI updates with minimal React glue
- Simple DI to share services across your app

This repo contains three publishable packages:
- `@react-logic/core` — `useLogic` hook to bind a logic class to a component
- `@react-logic/state` — signal utilities (`state`, `computedState`, `asyncState`)
- `@react-logic/di` — lightweight dependency injection (`Provider`, `inject`, tokens)


## Why

React components mix rendering with business logic. This project lets you:
- Define logic in plain classes (no React APIs inside)
- Use signals for state and derived values
- Bind logic to the component via `useLogic` so React re-renders when signals change

Your logic stays testable and framework-free, while React focuses on rendering.


## Install

Use any package manager; examples below use npm.

```sh
npm install @react-logic/core @react-logic/state @react-logic/di
```


## Quick start

Start with a simple logic class and a React component:

```tsx
import { useLogic } from '@react-logic/core';
import { state, computedState } from '@react-logic/state';

class CounterLogic {
  count = state(0);
  doubled = computedState(() => this.count() * 2);

  inc() { this.count(this.count() + 1); }
  dec() { this.count(this.count() - 1); }
}

export default function Counter() {
  const logic = useLogic(CounterLogic);

  return (
    <div>
      <p>Count: {logic.count()}</p>
      <p>Doubled: {logic.doubled()}</p>
      <button onClick={() => logic.dec()}>-</button>
      <button onClick={() => logic.inc()}>+</button>
    </div>
  );
}
```

Key ideas:
- Logic classes hold signals; read with `signal()`, write with `signal(next)`.
- `useLogic(CounterLogic)` returns a single instance for the component and re-renders when signals used during render change.

We’ll add more docs later with DI and advanced patterns.


## API reference (short)

### @react-logic/state
- `state<T>(initial: T)` — create a signal function `s() / s(next)`.
- `computedState<T>(fn: () => T)` — derived signal from other signals.

### @react-logic/core
- `useLogic<T>(LogicClass: new () => T, cleanup?: (instance: T) => void): T` — bind a logic class to a component.


## Demo app

There’s a runnable demo in `demo/`. To try it:

```sh
npm install
npm run dev -w demo
```

Or with Nx:

```sh
npx nx serve demo
```


## License

MIT
