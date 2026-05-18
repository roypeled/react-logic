## :gear: Functions

- [inject](#page_facing_up-inject)

### :gear: inject

Inject a dependency from the current injection context.
To be used inside logic classes or other injected constructs.

| Function | Type |
| ---------- | ---------- |
| `inject` | `InjectFn` |

Parameters:

* `token`: - The injection token or class to resolve.
* `options`: - Optional injection options.


Returns:

The resolved dependency instance.

Examples:

```ts
class MyService {
  constructor() {
    // ...
  }
}

class MyLogic {
  myService = inject(MyService)
}
```


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/inject.ts#L39)



## :abc: Types

- [InjectOptions](#page_facing_up-injectoptions)

### :gear: InjectOptions

Injection options for the `inject` function.

| Type | Type |
| ---------- | ---------- |
| `InjectOptions` | `Optional or NotOptional` |

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/inject.ts#L11)

