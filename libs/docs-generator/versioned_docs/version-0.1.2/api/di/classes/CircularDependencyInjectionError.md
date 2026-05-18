# Class: CircularDependencyInjectionError

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-sources">

Defined in: [di/src/lib/default-adapter.ts:101](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/default-adapter.ts#L101)

</div>

Thrown when a service's constructor injects a token whose construction is
already in progress in the same scope — i.e. `A` injects `B` injects `A`.

The error message includes the full injection path that triggered the
cycle, so you can see how the loop was reached. Resolve cycles by either
inverting a dependency, lazy-injecting via a factory provider that defers
the lookup, or splitting a service into two.

<div class="api-hierarchy">

## Extends

- `Error`

</div>

## Constructors

### Constructor

<div class="api-signature">

> **new CircularDependencyInjectionError**(`type`, `injectionTreeType`, `injectorName`): `CircularDependencyInjectionError`

</div>

<div class="api-sources">

Defined in: [di/src/lib/default-adapter.ts:102](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/default-adapter.ts#L102)

</div>

#### Parameters

<div class="api-parameters">

##### type

[`InjectionType`](../type-aliases/InjectionType.md)\<`unknown`\>

##### injectionTreeType

[`InjectionType`](../type-aliases/InjectionType.md)\<`unknown`\>[]

##### injectorName

`string`

</div>

#### Returns

`CircularDependencyInjectionError`

<div class="api-inheritance">

#### Overrides

`Error.constructor`

</div>
