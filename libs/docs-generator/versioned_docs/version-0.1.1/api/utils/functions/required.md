# Function: required()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **required**\<`N`\>(`message?`, `name?`): [`ValidatorEntry`](../interfaces/ValidatorEntry.md)\<`unknown`\> & `object`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms-validators.ts:34](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms-validators.ts#L34)

</div>

Reject empty values. Treats `undefined`, `null`, `''`, and `false`
(unchecked checkbox / unselected select) as failures. Pass on everything
else.

## Type Parameters

### N

`N` *extends* `string` = `"required"`

## Parameters

<div class="api-parameters">

### message?

`string` = `'Required'`

### name?

`N` = `...`

</div>

## Returns

[`ValidatorEntry`](../interfaces/ValidatorEntry.md)\<`unknown`\> & `object`
