# Function: asyncState()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **asyncState**\<`T`\>(`fn`): () => `T` \| `undefined`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/async-state.ts:37](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/async-state.ts#L37)

</div>

Like `state()`, but seeded by an async producer. Starts as `undefined`,
resolves to the awaited value, and notifies subscribers when it does.

The returned getter is read-only — there's no setter. The producer runs
inside an effect, so any signals it reads become tracked dependencies; if
those change, the producer re-runs and the value updates again. Useful
for derived async data that should reload when inputs change (e.g. a
fetch keyed off a user-id signal).

No built-in error handling — wrap the producer in try/catch and store
status fields in companion `state()`s if you need richer states (loading,
error, success).

## Type Parameters

### T

`T`

The resolved value's type. Inferred from `fn`'s return.

## Parameters

<div class="api-parameters">

### fn

() => `Promise`\<`T`\>

A function that returns a promise; tracked for re-execution.

</div>

## Returns

A getter for the resolved value, or `undefined` until the first
  resolve completes.

() => `T` \| `undefined`

## Example

```ts
import { asyncState } from '@react-logic/utils';
import { state } from '@react-logic/state';

class UserProfile {
  userId = state<string | null>(null);
  profile = asyncState(async () => {
    const id = this.userId();
    if (!id) return null;
    return (await fetch(`/users/${id}`)).json();
  });
}
```
