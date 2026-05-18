# Function: formGroup()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **formGroup**\<`S`\>(`schema`): [`FormGroup`](../interfaces/FormGroup.md)\<`S`\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:49](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L49)

</div>

Mark an object literal as a nested **group** inside a form schema. Plain
objects without this marker are treated as field configs.

## Type Parameters

### S

`S` *extends* [`Schema`](../type-aliases/Schema.md)

## Parameters

<div class="api-parameters">

### schema

`S`

</div>

## Returns

[`FormGroup`](../interfaces/FormGroup.md)\<`S`\>

## Example

```ts
formState({
  name:    {},
  email:   {},
  address: formGroup({
    street: {},
    city:   {},
    zip:    {},
  }),
});
```
