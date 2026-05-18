# Function: setDefaultAdapterLogger()

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **setDefaultAdapterLogger**(`fn`): `void`

</div>

<div class="api-sources">

Defined in: [di/src/lib/default-adapter.ts:23](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/default-adapter.ts#L23)

</div>

Swap the default adapter's logger. The adapter emits a line per
construction event ("Creating class instance for X", "Creating value
instance for Y", etc.) — by default routed to `console.debug` so it stays
out of the way in production. Tests can route it to `console.log` (or any
other sink) for visibility.

Affects only the default adapter. Custom adapters control their own
logging.

## Parameters

<div class="api-parameters">

### fn

(...`args`) => `void`

</div>

## Returns

`void`
