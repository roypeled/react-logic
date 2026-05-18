# Class: GroupNode

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:387](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L387)

</div>

## Constructors

### Constructor

<div class="api-signature">

> **new GroupNode**(`path`, `children`): `GroupNode`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:391](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L391)

</div>

#### Parameters

<div class="api-parameters">

##### path

`string`[]

##### children

`Map`\<`string`, `GroupNode` \| [`FieldNode`](FieldNode.md)\<`unknown`\>\>

</div>

#### Returns

`GroupNode`

## Properties

### children

<div class="api-signature">

> `readonly` **children**: `Map`\<`string`, `GroupNode` \| [`FieldNode`](FieldNode.md)\<`unknown`\>\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:389](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L389)

</div>

***

### path

<div class="api-signature">

> `readonly` **path**: `string`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:388](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L388)

</div>

## Methods

### isPristine()

<div class="api-signature">

> **isPristine**(): `boolean`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:407](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L407)

</div>

#### Returns

`boolean`

***

### isValid()

<div class="api-signature">

> **isValid**(): `boolean`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:400](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L400)

</div>

#### Returns

`boolean`

***

### markAllTouched()

<div class="api-signature">

> **markAllTouched**(): `void`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:416](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L416)

</div>

#### Returns

`void`

***

### reset()

<div class="api-signature">

> **reset**(): `void`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:396](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L396)

</div>

#### Returns

`void`
