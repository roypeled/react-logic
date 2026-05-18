# Type Alias: FetchStateBody

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **FetchStateBody** = `BodyInit` \| `object` \| `null`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:85](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L85)

</div>

Request body. Standard `BodyInit` (string, FormData, Blob, etc.) goes
through as-is. Plain objects and arrays are JSON-stringified
automatically and a `Content-Type: application/json` header is set if
one isn't already present.
