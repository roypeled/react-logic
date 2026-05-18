# Function: createAxiosFetchAdapter()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **createAxiosFetchAdapter**(`axios`): [`FetchAdapter`](../type-aliases/FetchAdapter.md)

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-adapter.ts:141](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-adapter.ts#L141)

</div>

Wrap an axios instance as a `FetchAdapter`. The instance you pass in is
the one that will be used — install interceptors, base URLs, auth
headers on it before passing.

The adapter forces axios into raw-text mode (`responseType: 'text'`,
`transformResponse: identity`) so the lazy `json()` / `text()` contract
on `FetchResponse` matches the native fetch behaviour. JSON parsing
happens in `parse` (or its default), not in the adapter.

`validateStatus` is set to `null` so axios doesn't throw on non-2xx —
we want to surface the `FetchResponse.ok = false` path the same way
`fetch` does. `fetchState`'s default `parse` will then return a non-`ok`
response, which the user can branch on in their own `parse`.

## Parameters

<div class="api-parameters">

### axios

`AxiosLikeClient`

Your axios instance (e.g. `axios.create({...})` or the
  default singleton).

</div>

## Returns

[`FetchAdapter`](../type-aliases/FetchAdapter.md)

A `FetchAdapter` ready to pass to `setFetchStateAdapter` or to
  the per-call `fetcher` config.
