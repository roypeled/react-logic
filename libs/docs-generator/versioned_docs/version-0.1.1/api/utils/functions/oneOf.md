# Function: oneOf()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **oneOf**\<`T`, `N`\>(`values`, `message?`, `name?`): [`ValidatorEntry`](../interfaces/ValidatorEntry.md)\<`T`\> & `object`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms-validators.ts:199](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms-validators.ts#L199)

</div>

Value must be one of the provided literals. Useful for select / radio
fields where the schema doesn't already constrain the type.

## Type Parameters

### T

`T`

### N

`N` *extends* `string` = `"oneOf"`

## Parameters

<div class="api-parameters">

### values

readonly `T`[]

### message?

`string` = `'Invalid choice'`

### name?

`N` = `...`

</div>

## Returns

[`ValidatorEntry`](../interfaces/ValidatorEntry.md)\<`T`\> & `object`
