# Function: getDIAdapter()

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **getDIAdapter**(): [`DIAdapter`](../interfaces/DIAdapter.md)

</div>

<div class="api-sources">

Defined in: [di/src/lib/adapter.ts:103](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/adapter.ts#L103)

</div>

Returns the currently-installed DI adapter. Throws if none is registered
(which only happens if the entry file never imported `@react-logic/di` —
the import side-effect registers the default adapter).

Most user code shouldn't need this. It's exposed for adapter implementers,
tooling, and the framework's own internals (`useLogic`, `<Injector>`, etc.).

## Returns

[`DIAdapter`](../interfaces/DIAdapter.md)
