# Interface: FormProps

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-sources">

Defined in: [utils/src/lib/use-form.tsx:41](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/use-form.tsx#L41)

</div>

Props on the rendered `<Form>` component.

<div class="api-hierarchy">

## Extends

- `Omit`\<`FormHTMLAttributes`\<`HTMLFormElement`\>, `"onSubmit"`\>

</div>

## Type Parameters

### S

`S` *extends* [`Schema`](../type-aliases/Schema.md)

## Properties

### children

<div class="api-signature">

> **children**: `ReactNode`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/use-form.tsx:43](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/use-form.tsx#L43)

</div>

<div class="api-inheritance">

#### Overrides

`Omit.children`

</div>

***

### onSubmit

<div class="api-signature">

> **onSubmit**: (`values`) => `void` \| `Promise`\<`void`\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/use-form.tsx:49](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/use-form.tsx#L49)

</div>

Called with the typed values on a valid submit. Receives `Values<S>`
— the parsed-and-typed snapshot, not the raw input strings.
Invalid submits are swallowed after marking every field touched.

#### Parameters

<div class="api-parameters">

##### values

[`Values`](../type-aliases/Values.md)\<`S`\>

</div>

#### Returns

`void` \| `Promise`\<`void`\>
