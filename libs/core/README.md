# @react-logic/core

`useLogic` — bind a plain logic class to a React component, with automatic re-renders driven by signals.

Part of [react-logic](https://github.com/roy-peled_sfrt/react-logic). For the full toolkit in one install, use [`@react-logic/react-logic`](https://npmjs.com/package/@react-logic/react-logic).

## Install

```sh
npm install @react-logic/core @react-logic/state @react-logic/di
```

Peer dependency: `react@^18 || ^19`.

## Usage

```tsx
import { useLogic } from '@react-logic/core';
import { state } from '@react-logic/state';

class CounterLogic {
  count = state(0);
  inc() { this.count(this.count() + 1); }
}

export function Counter() {
  const logic = useLogic(CounterLogic);
  return <button onClick={() => logic.inc()}>{logic.count()}</button>;
}
```

- One logic instance per component mount.
- Re-renders when any signal read during render changes.
- Optional cleanup callback: `useLogic(LogicClass, (instance) => { ... })`.

### Testing helpers

```ts
import { createTestInjectionScope, flushAsyncSignals } from '@react-logic/core/testing';
```

See the [project README](https://github.com/roy-peled_sfrt/react-logic#readme) for full docs and demos.

## License

MIT
