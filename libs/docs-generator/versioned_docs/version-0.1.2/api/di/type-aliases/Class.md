# Type Alias: Class

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **Class**\<`T`\> = () => `T`

</div>

<div class="api-sources">

Defined in: [di/src/lib/types.ts:16](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/types.ts#L16)

</div>

A constructable class with a zero-argument constructor — i.e. something that
can be instantiated by the DI container without further input.

The DI container can inject services that take constructor arguments, but
those arguments must come from `inject()` calls inside the constructor body
(or from field initializers), not from positional parameters. That's why
the type is `new () => T` and not `new (...args: any[]) => T`.

## Type Parameters

### T

`T`

The instance type the constructor produces.

## Returns

`T`
