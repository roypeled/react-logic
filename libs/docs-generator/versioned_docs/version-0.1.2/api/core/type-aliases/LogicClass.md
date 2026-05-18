# Type Alias: LogicClass

<div class="api-package">Imported from <code>@react-logic/core</code></div>


<div class="api-signature">

> **LogicClass**\<`T`\> = (...`args`) => `T`

</div>

<div class="api-sources">

Defined in: [core/src/lib/use.logic.ts:31](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/core/src/lib/use.logic.ts#L31)

</div>

Constructor signature accepted by `useLogic`.

Logic classes are constructed by the framework with no arguments — any
dependencies are pulled in via `inject()` calls inside the constructor or
field initializers. The variadic parameter type is for TypeScript variance
convenience, not because positional arguments are supported.

## Type Parameters

### T

`T` *extends* `object`

The instance type the logic class produces. Constrained to
  `object` so primitive returns aren't accepted.

## Parameters

<div class="api-parameters">

### args

...`any`[]

</div>

## Returns

`T`
