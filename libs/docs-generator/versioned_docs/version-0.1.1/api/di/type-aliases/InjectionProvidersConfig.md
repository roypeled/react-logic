# Type Alias: InjectionProvidersConfig

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **InjectionProvidersConfig** = `object`

</div>

<div class="api-sources">

Defined in: [di/src/lib/types.ts:109](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/types.ts#L109)

</div>

The shape of the `provide` prop accepted by `<Injector>`. Extracted so it
can be reused on custom wrapper components that pass providers through.

## Properties

### provide?

<div class="api-signature">

> `optional` **provide?**: [`ProviderEntry`](ProviderEntry.md)[]

</div>

<div class="api-sources">

Defined in: [di/src/lib/types.ts:115](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/types.ts#L115)

</div>

Providers to add to the surrounding injection scope. Bare classes are
accepted as shorthand for `{ provide: C, useClass: C }`. The order of
the array doesn't matter; tokens are looked up by identity.
