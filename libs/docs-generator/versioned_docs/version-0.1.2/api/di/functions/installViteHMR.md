# Function: installViteHMR()

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **installViteHMR**(`hot`): `void`

</div>

<div class="api-sources">

Defined in: [di/src/lib/hmr.ts:35](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/hmr.ts#L35)

</div>

Wires the default adapter's reset into Vite's pre-update event so every
HMR cycle disposes the global scope cleanly.

## Parameters

<div class="api-parameters">

### hot

`false` \| `ViteHot` \| `undefined`

</div>

## Returns

`void`

## Example

```ts
// main.tsx
import { installViteHMR } from '@react-logic/di';
installViteHMR(import.meta.hot);
```
