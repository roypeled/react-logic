# Function: useLogic()

<div class="api-package">Imported from <code>@react-logic/core</code></div>


<div class="api-signature">

> **useLogic**\<`T`\>(`logicClass`, `cleanup?`): `LogicInstance`\<`T`\>

</div>

<div class="api-sources">

Defined in: [core/src/lib/use.logic.ts:125](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/core/src/lib/use.logic.ts#L125)

</div>

A React hook to use a logic class with dependency injection and state management.

## Type Parameters

### T

`T` *extends* `object`

The logic-class instance type. Inferred from `logicClass`.

## Parameters

<div class="api-parameters">

### logicClass

[`LogicClass`](../type-aliases/LogicClass.md)\<`T`\>

The logic class to instantiate and manage.

### cleanup?

(`instance`) => `void`

An optional cleanup function to run when the component unmounts, receiving the logic instance.

</div>

## Returns

`LogicInstance`\<`T`\>

The instance of the logic class.

## Example

```tsx
class MyLogic {
  count = state(0);
  increment() {
    this.count(this.count() + 1);
  }
}
const MyComponent = () => {
  const logic = useLogic(MyLogic);
  return (
    <div>
      <p>Count: {logic.count()}</p>
      <button onClick={() => logic.increment()}>Increment</button>
    </div>
  );
}
```
