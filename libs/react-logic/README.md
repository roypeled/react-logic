# react-logic

Umbrella package — re-exports `@react-logic/core`, `@react-logic/state`, and
`@react-logic/di` from a single entry point. Optional packages
(`@react-logic/utils`, `@react-logic/angular-adapter`) are kept separate so
the base install stays minimal.

```ts
import { state, computedState, useLogic, inject } from '@react-logic/react-logic';
```
