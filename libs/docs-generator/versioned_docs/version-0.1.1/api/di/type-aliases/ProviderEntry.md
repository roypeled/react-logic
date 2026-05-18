# Type Alias: ProviderEntry

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **ProviderEntry**\<`T`\> = [`Provider`](Provider.md)\<`T`\> \| [`Class`](Class.md)\<`T`\>

</div>

<div class="api-sources">

Defined in: [di/src/lib/types.ts:101](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/types.ts#L101)

</div>

An entry in an `Injector`'s `provide` array.

A bare class is sugar for `{ provide: Class, useClass: Class }` — equivalent
to "use this class as both the token and its own implementation". This is
the most common case: provide a class, get its instances on demand.

Mix bare classes with full `Provider` objects freely:
`provide={[CounterStore, { provide: API_URL, useValue: '/api' }]}`.

## Type Parameters

### T

`T` = `unknown`

The type the provider entry resolves to.
