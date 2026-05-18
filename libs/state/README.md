# @react-logic/state

Signal primitives: `state`, `computedState`, `effect`, `batch`.

Part of [react-logic](https://github.com/roypeled/react-logic). For the full toolkit in one install, use [`@react-logic/react-logic`](https://npmjs.com/package/@react-logic/react-logic).

## Install

```sh
npm install @react-logic/state
```

Peer dependency: `react@^18 || ^19`. Pulls in `@react-logic/di` transitively for effect lifetime management.

## Usage

```ts
import { state, computedState, effect, batch } from '@react-logic/state';

const count = state(0);
const doubled = computedState(() => count() * 2);

effect(() => console.log('count:', count(), 'doubled:', doubled()));

count(1);          // → "count: 1 doubled: 2"

batch(() => {
  count(2);
  count(3);        // both writes coalesce; effect fires once at end
});
```

- Read with `s()`, write with `s(next)`.
- `computedState` accepts an optional input arg variant for derived signals parameterized at call time.
- `effect` returns a disposer; cleanup is auto-tracked inside `useLogic` and injection scopes.

See the [project README](https://github.com/roypeled/react-logic#readme) for full docs and demos.

## License

MIT
