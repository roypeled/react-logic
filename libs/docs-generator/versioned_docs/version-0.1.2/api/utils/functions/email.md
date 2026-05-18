# Function: email()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **email**\<`N`\>(`message?`, `name?`): [`ValidatorEntry`](../interfaces/ValidatorEntry.md)\<`string`\> & `object`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms-validators.ts:113](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms-validators.ts#L113)

</div>

Email format check. Sets `type="email"` and `inputMode="email"`.

## Type Parameters

### N

`N` *extends* `string` = `"email"`

## Parameters

<div class="api-parameters">

### message?

`string` = `'Invalid email'`

### name?

`N` = `...`

</div>

## Returns

[`ValidatorEntry`](../interfaces/ValidatorEntry.md)\<`string`\> & `object`
