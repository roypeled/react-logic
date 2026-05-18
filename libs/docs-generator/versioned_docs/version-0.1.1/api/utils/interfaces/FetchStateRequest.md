# Interface: FetchStateRequest

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:126](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L126)

</div>

The full request descriptor a build callback may return — same as
`FetchStateConfig` plus a required `url`. Either both helpers'
callbacks return this object, or a bare URL string as a shorthand for
`{ url }`.

<div class="api-hierarchy">

## Extends

- [`FetchStateConfig`](FetchStateConfig.md)\<`T`\>

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

<div class="api-inheritance">

#### Inherited from

[`FetchStateConfig`](FetchStateConfig.md).[`body`](FetchStateConfig.md#body)

</div>

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

<div class="api-inheritance">

#### Inherited from

[`FetchStateConfig`](FetchStateConfig.md).[`fetcher`](FetchStateConfig.md#fetcher)

</div>

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

<div class="api-inheritance">

#### Inherited from

[`FetchStateConfig`](FetchStateConfig.md).[`parse`](FetchStateConfig.md#parse)

</div>

***

### url

<div class="api-signature">

> **url**: `string`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:127](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L127)

</div>
