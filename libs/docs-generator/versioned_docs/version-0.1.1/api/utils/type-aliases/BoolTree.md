# Type Alias: BoolTree

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **BoolTree**\<`S`\> = `{ [K in keyof S]: S[K] extends FormGroup<infer Inner> ? BoolTree<Inner> : S[K] extends FieldConfig<infer _> ? boolean : never }`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:186](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L186)

</div>

Recursive tree of booleans — `touched`, `dirty`.

## Type Parameters

### S

`S`
