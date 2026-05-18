# Function: pattern()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **pattern**\<`N`\>(`regex`, `message?`, `name?`): [`ValidatorEntry`](../interfaces/ValidatorEntry.md)\<`string`\> & `object`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/forms-validators.ts:93](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/forms-validators.ts#L93)

</div>

String must match `regex`. Pairs with the HTML `pattern` attribute —
mirrors `regex.source` (flags ignored, which matches HTML semantics).

Two `pattern()` validators on one field need distinct names — pass the
third arg to disambiguate:

```ts
validators: [
  pattern(/[A-Z]/, 'Needs uppercase', 'uppercase'),
  pattern(/\d/,    'Needs digit',     'digit'),
]
// errors.password.uppercase, errors.password.digit
```

## Type Parameters

### N

`N` *extends* `string` = `"pattern"`

## Parameters

<div class="api-parameters">

### regex

`RegExp`

### message?

`string` = `'Invalid format'`

### name?

`N` = `...`

</div>

## Returns

[`ValidatorEntry`](../interfaces/ValidatorEntry.md)\<`string`\> & `object`
