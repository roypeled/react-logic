# Function: setDIAdapter()

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **setDIAdapter**(`adapter`): `void`

</div>

<div class="api-sources">

Defined in: [di/src/lib/adapter.ts:89](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/adapter.ts#L89)

</div>

Install the DI adapter for the application. Call once before mounting React.

The default adapter (alien-signals + the built-in DI) registers itself
automatically when `@react-logic/di` is imported, so most apps never call
this. You only need it when you're swapping in a different adapter — e.g.
`createAngularAdapter(...)` from `@react-logic/angular-adapter` to back
react-logic with Angular's DI.

Calling this *after* logic classes have already been instantiated will
leave those instances bound to the previous adapter — register early.

## Parameters

<div class="api-parameters">

### adapter

[`DIAdapter`](../interfaces/DIAdapter.md)

</div>

## Returns

`void`

## Example

```ts
import { setDIAdapter } from '@react-logic/di';
import { createAngularAdapter } from '@react-logic/angular-adapter';

setDIAdapter(createAngularAdapter(angularRootInjector));
// …then mount React.
```
