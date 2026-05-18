# Type Alias: Errors

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **Errors**\<`S`\> = `{ [K in keyof S]: S[K] extends FormGroup<infer Inner> ? Errors<Inner> : S[K] extends FieldConfig<infer _> ? FieldErrors<S[K]> : never }`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:178](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L178)

</div>

Recursive tree of per-field error maps.

## Type Parameters

### S

`S`
