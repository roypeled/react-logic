# Interface: FieldConfig

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:128](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L128)

</div>

Per-field configuration. All fields optional — an empty `{}` is a text
field with no validators and `''` as the initial.

## Type Parameters

### T

`T` = `string`

The field's value type.

## Properties

### initial?

<div class="api-signature">

> `readonly` `optional` **initial?**: `T`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:129](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L129)

</div>

***

### kind?

<div class="api-signature">

> `readonly` `optional` **kind?**: `"text"` \| `"checkbox"` \| `"radio"` \| `"select"`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:130](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L130)

</div>

***

### parse?

<div class="api-signature">

> `readonly` `optional` **parse?**: (`raw`) => `T`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:131](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L131)

</div>

#### Parameters

<div class="api-parameters">

##### raw

`string`

</div>

#### Returns

`T`

***

### validators?

<div class="api-signature">

> `readonly` `optional` **validators?**: readonly [`ValidatorEntry`](ValidatorEntry.md)\<`T`\>[]

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:132](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L132)

</div>
