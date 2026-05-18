# Class: InjectionError

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-sources">

Defined in: [di/src/lib/default-adapter.ts:65](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/default-adapter.ts#L65)

</div>

Generic injection failure raised by the default adapter — typically when a
provider is malformed (no `useValue`/`useClass`/`useFactory`). The more
specific subclasses below cover the common failure modes; catch this base
class to handle any DI-origin error uniformly.

<div class="api-hierarchy">

## Extends

- `Error`

</div>

## Constructors

### Constructor

<div class="api-signature">

> **new InjectionError**(`message`, `injectorName`): `InjectionError`

</div>

<div class="api-sources">

Defined in: [di/src/lib/default-adapter.ts:66](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/default-adapter.ts#L66)

</div>

#### Parameters

<div class="api-parameters">

##### message

`string`

##### injectorName

`string`

</div>

#### Returns

`InjectionError`

<div class="api-inheritance">

#### Overrides

`Error.constructor`

</div>
