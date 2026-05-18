# Type Alias: Schema

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **Schema** = `object`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms.ts:141](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms.ts#L141)

</div>

Top-level schema — keys are field names, values are configs or groups.
 Uses `any` because `FieldConfig<T>`'s contravariant `fn` parameter makes
 e.g. `FieldConfig<number>` not assignable to `FieldConfig<unknown>` — but
 the schema needs to accept either. Inference downstream is preserved by
 the `const S extends Schema` constraint on `formState`.

## Index Signature

\[`key`: `string`\]: [`FieldConfig`](../interfaces/FieldConfig.md)\<`any`\> \| [`FormGroup`](../interfaces/FormGroup.md)\<`any`\>
