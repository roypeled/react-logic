# Interface: FetchStateConfig

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:96](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L96)

</div>

Common config fields shared by `fetchState` and `callableFetchState`.
Mirrors `RequestInit` so `method`, `headers`, `credentials`, etc. land
directly on the config object — plus the wrapper-specific `parse` and
`fetcher` fields. Plain-object bodies are auto-stringified.

<div class="api-hierarchy">

## Extends

- `Omit`\<`RequestInit`, `"signal"` \| `"window"` \| `"body"`\>

## Extended by

- [`FetchStateRequest`](FetchStateRequest.md)

</div>

## Type Parameters

### T

`T` = `unknown`

The parsed response type.

## Properties

### body?

<div class="api-signature">

> `optional` **body?**: [`FetchStateBody`](../type-aliases/FetchStateBody.md)

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:102](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L102)

</div>

Plain objects/arrays are JSON-stringified; `BodyInit` values pass
through untouched.

***

### fetcher?

<div class="api-signature">

> `optional` **fetcher?**: [`FetchAdapter`](../type-aliases/FetchAdapter.md)

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:114](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L114)

</div>

Per-call HTTP adapter, overriding the global one set via
`setFetchStateAdapter`.

***

### parse?

<div class="api-signature">

> `optional` **parse?**: (`response`) => `Promise`\<`T`\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:109](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L109)

</div>

How to turn the response into the value. Defaults to a function that
throws when `!ok` and returns `r.json() as T` otherwise. Throw inside
`parse` to land in the failed state with that error and the response's
`status`.

#### Parameters

<div class="api-parameters">

##### response

[`FetchResponse`](FetchResponse.md)

</div>

#### Returns

`Promise`\<`T`\>
