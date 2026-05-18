# Function: effect()

<div class="api-package">Imported from <code>@react-logic/state</code></div>


<div class="api-signature">

> **effect**(`fn`): () => `void`

</div>

<div class="api-sources">

Defined in: [state/src/lib/state.ts:277](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/state/src/lib/state.ts#L277)

</div>

Creates a reactive effect that runs whenever its dependencies change.

The callback may return a cleanup function — same shape as React's
`useEffect`. Cleanup runs:
- Before each subsequent re-run, scoped to the previous invocation's deps.
- On final teardown — either when the user calls the returned stop, or
  automatically when the surrounding logic class / service scope is
  disposed (component unmount or `<Injector>` unmount).

Inside a logic class or service constructor, the framework auto-tracks the
effect and runs the final cleanup on scope teardown — you usually don't
need the returned stop function. Outside that context (top-level scripts,
other manual setups), capture and call it yourself.

## Parameters

<div class="api-parameters">

### fn

() => `void` \| (() => `void`)

The effect body. Return a cleanup function (or `void`).

</div>

## Returns

A function that stops the effect and runs the latest cleanup.

() => `void`

## Example

```ts
import { effect, state } from '@react-logic/state';

class WindowSize {
  width = state(window.innerWidth);
  height = state(window.innerHeight);
  constructor() {
    effect(() => {
      const handler = () => {
        this.width(window.innerWidth);
        this.height(window.innerHeight);
      };
      window.addEventListener('resize', handler);
      return () => window.removeEventListener('resize', handler);
    });
  }
}
```
