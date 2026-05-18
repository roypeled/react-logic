# Type Alias: InjectionType

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **InjectionType**\<`T`\> = [`InjectionToken`](../classes/InjectionToken.md)\<`T`\> \| [`Class`](Class.md)\<`T`\>

</div>

<div class="api-sources">

Defined in: [di/src/lib/types.ts:31](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/types.ts#L31)

</div>

Anything that can identify a dependency in the DI container — either a
concrete class (used as both token and constructor) or an `InjectionToken`
for opaque/value dependencies.

Using a class as a token gives you both the identity and a default
implementation in one — `inject(MyService)` works without any explicit
provider registration. `InjectionToken` is needed when the dependency has
no class identity (a config string, a function, a primitive value).

## Type Parameters

### T

`T`

The type the token resolves to.
