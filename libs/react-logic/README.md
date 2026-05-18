# @react-logic/react-logic

Umbrella package for [react-logic](https://github.com/roy-peled_sfrt/react-logic) — a tiny React toolkit that separates render from logic using signals and DI.

Re-exports the three required packages from a single entry point: [`@react-logic/core`](https://npmjs.com/package/@react-logic/core), [`@react-logic/state`](https://npmjs.com/package/@react-logic/state), [`@react-logic/di`](https://npmjs.com/package/@react-logic/di). Optional packages (`@react-logic/utils`, `@react-logic/angular-adapter`) are kept separate.

## Install

```sh
npm install @react-logic/react-logic
```

Peer dependency: `react@^18 || ^19`.

## Usage

```tsx
import { useLogic, state, computedState } from '@react-logic/react-logic';

class CounterLogic {
  count = state(0);
  doubled = computedState(() => this.count() * 2);

  inc() { this.count(this.count() + 1); }
}

export function Counter() {
  const logic = useLogic(CounterLogic);
  return (
    <button onClick={() => logic.inc()}>
      {logic.count()} (×2 = {logic.doubled()})
    </button>
  );
}
```

- Define logic in plain classes — no React APIs inside.
- Read signals with `s()`, write with `s(next)`.
- `useLogic(LogicClass)` returns a per-component instance and re-renders the component when signals it read change.

See the [project README](https://github.com/roy-peled_sfrt/react-logic#readme) for the full API surface, runnable demos, and DI examples.

## License

MIT
