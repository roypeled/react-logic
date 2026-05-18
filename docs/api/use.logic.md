## :gear: Functions

- [useLogic](#page_facing_up-uselogic)

### :gear: useLogic

A React hook to use a logic class with dependency injection and state management.

| Function | Type |
| ---------- | ---------- |
| `useLogic` | `<T extends object>(logicClass: LogicClass<T>, cleanup?: ((instance: T) => void) or undefined) => T` |

Parameters:

* `logicClass`: - The logic class to instantiate and manage.
* `cleanup`: - An optional cleanup function to run when the component unmounts, receiving the logic instance.


Returns:

The instance of the logic class.

Examples:

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


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/core/src/lib/use.logic.ts#L70)



## :abc: Types

- [LogicClass](#page_facing_up-logicclass)

### :gear: LogicClass

Type representing a class constructor for a logic class.

| Type | Type |
| ---------- | ---------- |
| `LogicClass` | `new (...args: any[]) => T` |

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/core/src/lib/use.logic.ts#L13)

