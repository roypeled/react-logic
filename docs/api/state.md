## :gear: Functions

- [asyncState](#page_facing_up-asyncstate)

### :gear: asyncState

Creates an asynchronous state that updates when the promise resolves.

| Function | Type |
| ---------- | ---------- |
| `asyncState` | `<T>(fn: () => Promise<T>) => () => T or undefined` |

Parameters:

* `fn`: - A function that returns a promise.


Examples:

```ts
const asyncValue = asyncState(async () => {
  const response = await fetch('https://api.example.com/data');
  return response.json();
});

// Usage
effect(() => {
  const value = asyncValue();
  if (value) {
    console.log('Async value:', value);
  } else {
    console.log('Loading...');
  }
});
```


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/state/src/lib/state.ts#L54)


## :nut_and_bolt: Constants

- [state](#page_facing_up-state)
- [computedState](#page_facing_up-computedstate)

### :gear: state

Creates a reactive state variable.

| Constant | Type |
| ---------- | ---------- |
| `state` | `{ <T>(): { (): T or undefined; (value: T or undefined): void; }; <T>(initialValue: T): { (): T; (value: T): void; }; }` |

Parameters:

* `initialValue`: - The initial value of the state.


Returns:

A function to get or set the state value.

Examples:

```ts
const count = state(0);
console.log(count()); // Get the current value
count(5); // Set a new value
console.log(count()); // 5
```


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/state/src/lib/state.ts#L15)

### :gear: computedState

Creates a computed state that automatically updates when its dependencies change.

| Constant | Type |
| ---------- | ---------- |
| `computedState` | `<T>(getter: (previousValue?: T or undefined) => T) => () => T` |

Parameters:

* `fn`: - A function that returns the computed value.


Returns:

The computed value.

Examples:

```ts
const count = state(2);
const doubleCount = computedState(() => count() * 2);
console.log(doubleCount()); // 4
count(3);
console.log(doubleCount()); // 6
```


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/state/src/lib/state.ts#L30)


