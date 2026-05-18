# Class: UnresolvedInjectionError

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-sources">

Defined in: [di/src/lib/default-adapter.ts:83](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/default-adapter.ts#L83)

</div>

Thrown when a non-optional token has no provider in the active scope chain
(neither the local scope nor any of its ancestors). For class tokens this
never fires — they're auto-registered. It only happens with custom
`InjectionToken`s that no `<Injector>` provided.

Pass `{ optional: true }` to `inject()` to receive `null` instead of this
error when the token is missing.

<div class="api-hierarchy">

## Extends

- `Error`

</div>

## Constructors

### Constructor

<div class="api-signature">

> **new UnresolvedInjectionError**(`type`, `injectorName`): `UnresolvedInjectionError`

</div>

<div class="api-sources">

Defined in: [di/src/lib/default-adapter.ts:84](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/default-adapter.ts#L84)

</div>

#### Parameters

<div class="api-parameters">

##### type

[`InjectionType`](../type-aliases/InjectionType.md)\<`unknown`\>

##### injectorName

`string`

</div>

#### Returns

`UnresolvedInjectionError`

<div class="api-inheritance">

#### Overrides

`Error.constructor`

</div>
