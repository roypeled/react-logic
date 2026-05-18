# Function: setFetchStateAdapter()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **setFetchStateAdapter**(`adapter`): `void`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-adapter.ts:87](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-adapter.ts#L87)

</div>

Replace the global `FetchAdapter` used by every `fetchState` call that
doesn't pass its own `fetcher` override. Call once at app boot — e.g.
to route every reactive fetch through axios:

```ts
import axios from 'axios';
import { setFetchStateAdapter, createAxiosFetchAdapter } from '@react-logic/utils';

setFetchStateAdapter(createAxiosFetchAdapter(axios));
```

## Parameters

<div class="api-parameters">

### adapter

[`FetchAdapter`](../type-aliases/FetchAdapter.md)

The new global adapter.

</div>

## Returns

`void`
