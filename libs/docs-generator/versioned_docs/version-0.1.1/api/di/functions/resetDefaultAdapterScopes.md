# Function: resetDefaultAdapterScopes()

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **resetDefaultAdapterScopes**(): `void`

</div>

<div class="api-sources">

Defined in: [di/src/lib/default-adapter.ts:313](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/default-adapter.ts#L313)

</div>

Disposes the default adapter's global scope and replaces it with a fresh
one. Intended for HMR cycles in dev — call from a bundler-specific hook
(see `installViteHMR`, `installWebpackHMR`, `installParcelHMR`) so service
`onDestroy` callbacks fire and stale class identities don't pile up.

Has no effect on user-created scopes (e.g. those from `<Injector>`); their
lifetimes are owned by React mount/unmount.

## Returns

`void`
