# Function: formState()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **formState**\<`S`\>(`schema`): [`FormHandle`](../interfaces/FormHandle.md)\<`S`\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:497](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L497)

</div>

Build a reactive form. Returns a callable signal — `form()` produces an
atomic `FormSnapshot` (values, errors, touched, dirty, plus aggregate
`valid` / `pristine` / `submitting` / `submitted`).

Schema is recursive — use [formGroup](formGroup.md) for nested objects.
Empty `{}` is a text field with `''` initial. `kind: 'checkbox'` defaults
to `false`. Built-in validator factories live next to this module.

## Type Parameters

### S

`S` *extends* [`Schema`](../type-aliases/Schema.md)

The schema. Use the `const` modifier so validator-name
  literals propagate to `errors` typing.

## Parameters

<div class="api-parameters">

### schema

`S`

</div>

## Returns

[`FormHandle`](../interfaces/FormHandle.md)\<`S`\>
