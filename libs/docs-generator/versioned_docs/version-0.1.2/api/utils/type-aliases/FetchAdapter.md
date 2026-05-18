# Type Alias: FetchAdapter

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **FetchAdapter** = (`url`, `init`) => `Promise`\<[`FetchResponse`](../interfaces/FetchResponse.md)\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-adapter.ts:54](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-adapter.ts#L54)

</div>

Plug your HTTP client in here. Takes a URL and the normalised init, and
returns a `FetchResponse`. May reject — `fetchState` catches and routes
the error into the failed state.

## Parameters

<div class="api-parameters">

### url

`string`

### init

[`FetchAdapterInit`](../interfaces/FetchAdapterInit.md)

</div>

## Returns

`Promise`\<[`FetchResponse`](../interfaces/FetchResponse.md)\>
