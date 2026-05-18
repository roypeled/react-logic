# Function: installParcelHMR()

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **installParcelHMR**(`hot`): `void`

</div>

<div class="api-sources">

Defined in: [di/src/lib/hmr.ts:72](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/hmr.ts#L72)

</div>

Wires the default adapter's reset into Parcel's HMR dispose hook.

## Parameters

<div class="api-parameters">

### hot

`false` \| `DisposableHot` \| `undefined`

</div>

## Returns

`void`

## Example

```ts
// main.tsx
import { installParcelHMR } from '@react-logic/di';
// Parcel exposes HMR via the CommonJS-style `module.hot`.
installParcelHMR((module as unknown as { hot?: { dispose(cb: () => void): void } }).hot);
```
