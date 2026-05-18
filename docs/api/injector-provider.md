## :gear: Functions

- [Injector](#page_facing_up-injector)
- [useInjector](#page_facing_up-useinjector)

### :gear: Injector

Injector component that provides a new injection context to its children.
It can accept an optional array of providers to extend the current context.
It uses React's context API to manage the injection context.
It creates the injection context from the parent context and the provided providers.

| Function | Type |
| ---------- | ---------- |
| `Injector` | `FunctionComponent<InjectorProviderProps>` |

Parameters:

* `provide`: - Optional array of providers to add to the current injection context. test 
* `children`: - The child components that will have access to the new injection context.


Examples:

```tsx
<Injector provide={[{ provide: MyService, useClass: MyServiceImpl }]}>
  <MyComponent />
</Injector>

const MyComponent: React.FC = () => {
  const myService = useInjector(MyService); // Injects an instance of MyServiceImpl from the context
  // Use myService...
}
```


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injector-provider.tsx#L24)

### :gear: useInjector

Hook to inject a dependency from the current injection context.
It retrieves the instance of the specified type from the context.
If no provider is found for the type, it throws an error.

| Function | Type |
| ---------- | ---------- |
| `useInjector` | `<T, O extends boolean or undefined>(type: InjectionType<T>, optional?: O or undefined) => IsOptional<O, T>` |

Parameters:

* `type`: - The injection token or class to resolve.
* `optional`: - Optional flag indicating if the injection is optional.


Returns:

The resolved dependency instance.

Examples:

```tsx
// Non-optional injection
const MyComponent: React.FC = () => {
  const myService = useInjector(MyService);
  // Use myService...
}

// Optional injection
const MyComponent: React.FC = () => {
  const myService = useInjector(MyService, true); // myService can be null if not provided
  // Use myService...
}
```


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injector-provider.tsx#L59)


