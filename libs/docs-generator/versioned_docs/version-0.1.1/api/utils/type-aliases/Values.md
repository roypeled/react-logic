# Type Alias: Values

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **Values**\<`S`\> = `{ [K in keyof S]: S[K] extends FormGroup<infer Inner> ? Values<Inner> : S[K] extends FieldConfig<infer _> ? FieldValue<S[K]> : never }`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:155](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L155)

</div>

Recursive tree of resolved field values.

## Type Parameters

### S

`S`
