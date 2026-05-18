# Interface: FetchAdapterInit

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-sources">

Defined in: [utils/src/lib/fetch-adapter.ts:42](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-adapter.ts#L42)

</div>

Init forwarded to the adapter. Mirrors `RequestInit` minus the `signal`
(the wrapper sets that itself) and minus `window` (only meaningful for
`fetch` in some environments).

`signal` is added at call time and is always present when the adapter
receives the init.

<div class="api-hierarchy">

## Extends

- `Omit`\<`RequestInit`, `"signal"` \| `"window"`\>

</div>

## Properties

### signal

<div class="api-signature">

> `readonly` **signal**: `AbortSignal`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-adapter.ts:44](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-adapter.ts#L44)

</div>
