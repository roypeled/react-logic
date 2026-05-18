# Class: FieldNode

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:272](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L272)

</div>

## Type Parameters

### T

`T` = `unknown`

## Constructors

### Constructor

<div class="api-signature">

> **new FieldNode**\<`T`\>(`path`, `config`): `FieldNode`\<`T`\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:293](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L293)

</div>

#### Parameters

<div class="api-parameters">

##### path

`string`[]

##### config

[`FieldConfig`](../interfaces/FieldConfig.md)\<`T`\>

</div>

#### Returns

`FieldNode`\<`T`\>

## Properties

### dirty

<div class="api-signature">

> `readonly` **dirty**: () => `boolean`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:291](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L291)

</div>

Dirty = value differs from initial.

#### Returns

`boolean`

***

### errors

<div class="api-signature">

> `readonly` **errors**: () => `Record`\<`string`, `string` \| `null`\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:289](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L289)

</div>

Per-validator-name error map.

#### Returns

`Record`\<`string`, `string` \| `null`\>

***

### htmlAttrs

<div class="api-signature">

> `readonly` **htmlAttrs**: [`HTMLValidationAttrs`](../interfaces/HTMLValidationAttrs.md)

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:279](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L279)

</div>

***

### initial

<div class="api-signature">

> `readonly` **initial**: `T`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:275](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L275)

</div>

***

### kind

<div class="api-signature">

> `readonly` **kind**: `"text"` \| `"checkbox"` \| `"radio"` \| `"select"`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:276](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L276)

</div>

***

### parse?

<div class="api-signature">

> `readonly` `optional` **parse?**: (`raw`) => `T`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:277](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L277)

</div>

#### Parameters

<div class="api-parameters">

##### raw

`string`

</div>

#### Returns

`T`

***

### path

<div class="api-signature">

> `readonly` **path**: `string`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:273](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L273)

</div>

***

### pathKey

<div class="api-signature">

> `readonly` **pathKey**: `string`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:274](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L274)

</div>

***

### rawValue

<div class="api-signature">

> `readonly` **rawValue**: \{(): `string` \| `boolean`; (`value`): `void`; \}

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:282](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L282)

</div>

Underlying raw input (string for text/select/radio, boolean for checkbox).

#### Call Signature

<div class="api-signature">

> (): `string` \| `boolean`

</div>

##### Returns

`string` \| `boolean`

#### Call Signature

<div class="api-signature">

> (`value`): `void`

</div>

##### Parameters

<div class="api-parameters">

###### value

`string` \| `boolean`

</div>

##### Returns

`void`

***

### touched

<div class="api-signature">

> `readonly` **touched**: \{(): `boolean`; (`value`): `void`; \}

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:284](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L284)

</div>

Touched state — flips true on blur or on submit.

#### Call Signature

<div class="api-signature">

> (): `boolean`

</div>

##### Returns

`boolean`

#### Call Signature

<div class="api-signature">

> (`value`): `void`

</div>

##### Parameters

<div class="api-parameters">

###### value

`boolean`

</div>

##### Returns

`void`

***

### validators

<div class="api-signature">

> `readonly` **validators**: readonly [`ValidatorEntry`](../interfaces/ValidatorEntry.md)\<`T`\>[]

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:278](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L278)

</div>

***

### value

<div class="api-signature">

> `readonly` **value**: () => `T`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:287](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L287)

</div>

Parsed/typed value — read this for `values`.

#### Returns

`T`

## Methods

### isValid()

<div class="api-signature">

> **isValid**(): `boolean`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:380](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L380)

</div>

#### Returns

`boolean`

***

### reset()

<div class="api-signature">

> **reset**(): `void`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:371](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L371)

</div>

#### Returns

`void`
