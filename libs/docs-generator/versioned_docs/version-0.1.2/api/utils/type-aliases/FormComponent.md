# Type Alias: FormComponent

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **FormComponent**\<`S`\> = (`props`) => `ReactElement` & `object`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/use-form.tsx:100](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/use-form.tsx#L100)

</div>

Bound form component returned by `useForm`. Renders a `<form>` element
and exposes three proxies as properties: `bind` (raw props to spread),
`error` (per-validator-name error maps), and `inputs` (pre-built
`<input>` / `<select>` components per field — sugar for the common
spread case).

## Type Declaration

### bind

<div class="api-signature">

> `readonly` **bind**: `Bind`\<`S`\>

</div>

### error

<div class="api-signature">

> `readonly` **error**: `ErrorTree`\<`S`\>

</div>

### inputs

<div class="api-signature">

> `readonly` **inputs**: `Inputs`\<`S`\>

</div>

## Type Parameters

### S

`S` *extends* [`Schema`](Schema.md)
