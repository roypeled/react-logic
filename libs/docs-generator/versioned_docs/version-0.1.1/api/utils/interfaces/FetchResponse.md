# Interface: FetchResponse

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-sources">

Defined in: [utils/src/lib/fetch-adapter.ts:21](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-adapter.ts#L21)

</div>

Minimal Response-like surface that `fetchState`'s `parse` function
consumes. Both the native `fetch` `Response` and a custom adapter (e.g.
the axios one in this package) need to expose this shape.

## Properties

### ok

<div class="api-signature">

> `readonly` **ok**: `boolean`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-adapter.ts:23](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-adapter.ts#L23)

</div>

True when `status` is in the 200-299 range.

***

### status

<div class="api-signature">

> `readonly` **status**: `number`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-adapter.ts:25](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-adapter.ts#L25)

</div>

HTTP status code.

## Methods

### json()

<div class="api-signature">

> **json**(): `Promise`\<`unknown`\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-adapter.ts:27](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-adapter.ts#L27)

</div>

Parse body as JSON. Defaults to `unknown` — narrow with `parse`.

#### Returns

`Promise`\<`unknown`\>

***

### text()

<div class="api-signature">

> **text**(): `Promise`\<`string`\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-adapter.ts:29](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-adapter.ts#L29)

</div>

Parse body as text.

#### Returns

`Promise`\<`string`\>
