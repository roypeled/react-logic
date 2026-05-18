# Function: installWebpackHMR()

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **installWebpackHMR**(`hot`): `void`

</div>

<div class="api-sources">

Defined in: [di/src/lib/hmr.ts:54](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/hmr.ts#L54)

</div>

Wires the default adapter's reset into Webpack's HMR dispose hook. Webpack
fires this when *this* module is replaced; pair with `module.hot.accept()`
if you want it to fire on broader updates.

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
import { installWebpackHMR } from '@react-logic/di';
installWebpackHMR(import.meta.webpackHot);
```
