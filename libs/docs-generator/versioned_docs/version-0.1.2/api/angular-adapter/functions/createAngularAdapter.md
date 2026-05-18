# Function: createAngularAdapter()

<div class="api-package">Imported from <code>@react-logic/angular-adapter</code></div>


<div class="api-signature">

> **createAngularAdapter**(`rootInjector`): [`DIAdapter`](../../di/interfaces/DIAdapter.md)\<`EnvironmentInjector`\>

</div>

<div class="api-sources">

Defined in: [angular-adapter/src/lib/angular-adapter.ts:30](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/angular-adapter/src/lib/angular-adapter.ts#L30)

</div>

Build a `DIAdapter` backed by Angular's DI.

Pass an `EnvironmentInjector` to act as the root scope. Typically this is
the `EnvironmentInjector` from your Angular bootstrap, or a standalone one
created with `createEnvironmentInjector(providers, ɵNullInjector)` if you
want a React-only app that borrows Angular DI.

## Parameters

<div class="api-parameters">

### rootInjector

`EnvironmentInjector`

</div>

## Returns

[`DIAdapter`](../../di/interfaces/DIAdapter.md)\<`EnvironmentInjector`\>

## Example

```ts
import { createEnvironmentInjector } from '@angular/core';
import { setDIAdapter } from '@react-logic/di';
import { createAngularAdapter } from '@react-logic/angular-adapter';

const root = createEnvironmentInjector([], parentInjector);
setDIAdapter(createAngularAdapter(root));
```
