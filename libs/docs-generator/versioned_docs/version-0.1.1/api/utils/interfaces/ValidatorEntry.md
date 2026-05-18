# Interface: ValidatorEntry

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:114](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L114)

</div>

One validation rule on a field. `name` is required (becomes the error key
in the snapshot's `errors` tree); `message` defaults to `name` on failure;
`htmlAttrs` ride along into the input's bind props.

## Type Parameters

### T

`T`

The field's value type.

## Properties

### fn

<div class="api-signature">

> `readonly` **fn**: (`value`) => `boolean`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:116](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L116)

</div>

#### Parameters

<div class="api-parameters">

##### value

`T`

</div>

#### Returns

`boolean`

***

### htmlAttrs?

<div class="api-signature">

> `readonly` `optional` **htmlAttrs?**: [`HTMLValidationAttrs`](HTMLValidationAttrs.md)

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:118](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L118)

</div>

***

### message?

<div class="api-signature">

> `readonly` `optional` **message?**: `string`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:117](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L117)

</div>

***

### name

<div class="api-signature">

> `readonly` **name**: `string`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:115](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L115)

</div>
