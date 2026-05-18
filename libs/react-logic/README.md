# @react-logic/react-logic

Umbrella package — re-exports `@react-logic/core`, `@react-logic/state`, and `@react-logic/di` from a single entry point. Optional packages (`@react-logic/utils`, `@react-logic/angular-adapter`) are kept separate so the base install stays minimal.

## Install

```sh
npm install @react-logic/react-logic
```

```ts
import { state, computedState, useLogic, inject } from '@react-logic/react-logic';
```

## Develop (in this repo)

```sh
npm install
npx nx test @react-logic/react-logic     # vitest
npx nx build @react-logic/react-logic
npx nx lint @react-logic/react-logic
```

See the [root README](../../README.md) for the full overview and runnable demos.
