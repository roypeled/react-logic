# Variable: inject

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> `const` **inject**: `InjectFn`

</div>

<div class="api-sources">

Defined in: [di/src/lib/inject.ts:33](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/inject.ts#L33)

</div>

Inject a dependency from the current injection context. Must be called
synchronously during a logic class or service constructor.

## Type Param

The type the token resolves to.

## Type Param

The options shape. When `{ optional: true }`, the return
  type widens to `T | null`; otherwise it's `T`.

## Example

```ts
class MyLogic {
  service = inject(MyService);
}
```
