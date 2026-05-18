# Interface: FormHandle()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:213](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L213)

</div>

Callable form-state signal. Read with `()`, mutate via `setValue` /
`setError` / `reset`. The `useForm` hook reads the underlying tree for
its bind/error proxies.

## Type Parameters

### S

`S` *extends* [`Schema`](../type-aliases/Schema.md)

The schema.

<div class="api-signature">

> **FormHandle**(): [`FormSnapshot`](FormSnapshot.md)\<`S`\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:214](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L214)

</div>

Callable form-state signal. Read with `()`, mutate via `setValue` /
`setError` / `reset`. The `useForm` hook reads the underlying tree for
its bind/error proxies.

## Returns

[`FormSnapshot`](FormSnapshot.md)\<`S`\>

## Properties

### \[REACTIVE\_ACCESSOR\_MARKER\]

<div class="api-signature">

> **\[REACTIVE\_ACCESSOR\_MARKER\]**: `true`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:226](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L226)

</div>

## Methods

### reset()

<div class="api-signature">

> **reset**(): `void`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:217](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L217)

</div>

#### Returns

`void`

***

### setError()

<div class="api-signature">

> **setError**(`path`, `error`): `void`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:216](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L216)

</div>

#### Parameters

<div class="api-parameters">

##### path

`string`

##### error

`string` \| `null`

</div>

#### Returns

`void`

***

### setValue()

<div class="api-signature">

> **setValue**(`path`, `value`): `void`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:215](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L215)

</div>

#### Parameters

<div class="api-parameters">

##### path

`string`

##### value

`unknown`

</div>

#### Returns

`void`
