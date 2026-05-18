# Interface: DIAdapter

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-sources">

Defined in: [di/src/lib/adapter.ts:15](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/adapter.ts#L15)

</div>

The shape every DI adapter must implement. The framework uses this and
never reaches into adapter internals — this is what swaps in/out when you
choose between the built-in DI, Angular's, or any other.

`Scope` is the adapter-private handle representing one DI scope (a node in
the parent/child injector tree). The framework treats it as opaque.

## Type Parameters

### Scope

`Scope` = `unknown`

The adapter's internal scope handle type. Default is
  `unknown` because consumers (the framework) never inspect it.

## Properties

### rootScope

<div class="api-signature">

> `readonly` **rootScope**: `Scope`

</div>

<div class="api-sources">

Defined in: [di/src/lib/adapter.ts:17](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/adapter.ts#L17)

</div>

The implicit top-of-tree scope — used when no `<Injector>` wraps a tree.

## Methods

### construct()

<div class="api-signature">

> **construct**\<`T`\>(`scope`, `fn`): `object`

</div>

<div class="api-sources">

Defined in: [di/src/lib/adapter.ts:48](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/adapter.ts#L48)

</div>

Run a constructor (e.g. a logic class) inside `scope` with full tracking:
- `inject()` calls resolve through `scope` (and ancestors).
- `onDestroy()` calls inside `fn` are captured into the returned `dispose`.
  Service-internal `onDestroy` calls go to the service's own scope —
  they are *not* in this dispose.
- Records every value returned by `inject()` during `fn` for the caller
  (used by `useLogic` to subscribe to injected services' signals).

#### Type Parameters

##### T

`T`

The type returned by `fn` (typically the constructed instance).

#### Parameters

<div class="api-parameters">

##### scope

`Scope`

##### fn

() => `T`

</div>

#### Returns

`object`

##### dispose

<div class="api-signature">

> **dispose**: () => `void`

</div>

###### Returns

`void`

##### injected

<div class="api-signature">

> **injected**: `unknown`[]

</div>

##### result

<div class="api-signature">

> **result**: `T`

</div>

***

### createScope()

<div class="api-signature">

> **createScope**(`providers`, `parent`): `Scope`

</div>

<div class="api-sources">

Defined in: [di/src/lib/adapter.ts:20](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/adapter.ts#L20)

</div>

Create a child scope of `parent` that adds `providers`.

#### Parameters

<div class="api-parameters">

##### providers

[`Provider`](../type-aliases/Provider.md)[]

##### parent

`Scope`

</div>

#### Returns

`Scope`

***

### disposeScope()

<div class="api-signature">

> **disposeScope**(`scope`): `void`

</div>

<div class="api-sources">

Defined in: [di/src/lib/adapter.ts:26](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/adapter.ts#L26)

</div>

Tear down a scope: dispose every service it constructed locally and run
their `onDestroy` callbacks. Parent scopes are untouched.

#### Parameters

<div class="api-parameters">

##### scope

`Scope`

</div>

#### Returns

`void`

***

### inject()

<div class="api-signature">

> **inject**\<`T`\>(`token`, `optional?`): `T` \| `null`

</div>

<div class="api-sources">

Defined in: [di/src/lib/adapter.ts:59](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/adapter.ts#L59)

</div>

Resolve a token through the currently-active scope (set by `runIn`/`construct`).

#### Type Parameters

##### T

`T`

The type the token resolves to.

#### Parameters

<div class="api-parameters">

##### token

[`InjectionType`](../type-aliases/InjectionType.md)\<`T`\>

##### optional?

`boolean`

</div>

#### Returns

`T` \| `null`

***

### onDestroy()

<div class="api-signature">

> **onDestroy**(`fn`): `void`

</div>

<div class="api-sources">

Defined in: [di/src/lib/adapter.ts:62](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/adapter.ts#L62)

</div>

Register a teardown for the currently-constructing entity.

#### Parameters

<div class="api-parameters">

##### fn

() => `void`

</div>

#### Returns

`void`

***

### runIn()

<div class="api-signature">

> **runIn**\<`T`\>(`scope`, `fn`): `T`

</div>

<div class="api-sources">

Defined in: [di/src/lib/adapter.ts:35](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/adapter.ts#L35)

</div>

Run `fn` with `scope` as the active injection context — `inject()` calls
inside `fn` resolve through this scope. Used by `useInjector` and for
one-off resolutions.

#### Type Parameters

##### T

`T`

The return type of `fn`.

#### Parameters

<div class="api-parameters">

##### scope

`Scope`

##### fn

() => `T`

</div>

#### Returns

`T`
