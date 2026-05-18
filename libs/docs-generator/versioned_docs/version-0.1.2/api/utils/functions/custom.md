# Function: custom()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **custom**\<`T`, `N`\>(`name`, `fn`, `message?`, `htmlAttrs?`): [`ValidatorEntry`](../interfaces/ValidatorEntry.md)\<`T`\> & `object`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms-validators.ts:216](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms-validators.ts#L216)

</div>

Build a custom-named validator entry. Useful when you want literal-name
inference without the inline-object pattern, or to attach `htmlAttrs` to
your own rules.

## Type Parameters

### T

`T`

### N

`N` *extends* `string`

## Parameters

<div class="api-parameters">

### name

`N`

### fn

(`value`) => `boolean`

### message?

`string`

### htmlAttrs?

[`HTMLValidationAttrs`](../interfaces/HTMLValidationAttrs.md)

</div>

## Returns

[`ValidatorEntry`](../interfaces/ValidatorEntry.md)\<`T`\> & `object`
