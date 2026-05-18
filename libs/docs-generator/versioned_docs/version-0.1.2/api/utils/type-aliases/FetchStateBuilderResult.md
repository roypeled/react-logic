# Type Alias: FetchStateBuilderResult

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **FetchStateBuilderResult**\<`T`\> = `string` \| [`FetchStateRequest`](../interfaces/FetchStateRequest.md)\<`T`\> \| `null` \| `undefined`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:138](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L138)

</div>

What a build callback returns: a URL string (shorthand for a GET), a
full request descriptor, or a nullish value to skip this tick (only
meaningful inside `fetchState`; `callableFetchState` requires a
descriptor since the call was explicit).

## Type Parameters

### T

`T` = `unknown`
