## :gear: Functions

- [getGlobalContext](#page_facing_up-getglobalcontext)
- [collectInjectedInstances](#page_facing_up-collectinjectedinstances)
- [setInjectionLifecycleContext](#page_facing_up-setinjectionlifecyclecontext)
- [getInjectionLifecycleContext](#page_facing_up-getinjectionlifecyclecontext)

### :gear: getGlobalContext

Gets the global injection context.

| Function | Type |
| ---------- | ---------- |
| `getGlobalContext` | `() => InjectionContextInstance` |

Returns:

The global InjectionContextInstance.

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L204)

### :gear: collectInjectedInstances

Collects injected instances during the execution of a function.
This is used when creating logic classes to track which dependencies were injected.

| Function | Type |
| ---------- | ---------- |
| `collectInjectedInstances` | `() => () => unknown[]` |

Returns:

A function that, when called, stops the collection and returns the collected instances.

Examples:

```ts
const getInstances = collectInjectedInstances();
// ... perform injections ...
const instances = getInstances(); // Get collected instances
```


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L222)

### :gear: setInjectionLifecycleContext

Sets the current injection lifecycle context.
Used internally during logic class creation to inject dependencies from the correct context.

| Function | Type |
| ---------- | ---------- |
| `setInjectionLifecycleContext` | `(context: InjectionContextInstance) => () => void` |

Parameters:

* `context`: - The InjectionContextInstance to set as the current context.


Returns:

A function that, when called, restores the previous context.

Examples:

```ts
const restoreContext = setInjectionLifecycleContext(myContext);
// ... perform injections within myContext ...
restoreContext(); // Restore previous context
```


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L246)

### :gear: getInjectionLifecycleContext

Gets the current injection lifecycle context.

| Function | Type |
| ---------- | ---------- |
| `getInjectionLifecycleContext` | `() => InjectionContextInstance` |

Returns:

The current InjectionContextInstance. Will return the global context if no context is set.

Examples:

```ts
const context = getInjectionLifecycleContext();
const myService = context.get(MyService);
```


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L264)


## :nut_and_bolt: Constants

- [InjectionContext](#page_facing_up-injectioncontext)

### :gear: InjectionContext

The React context for dependency injection.

| Constant | Type |
| ---------- | ---------- |
| `InjectionContext` | `Context<InjectionContextInstance>` |

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L209)


## :books: InjectionError

Error thrown when there is an issue during the injection process.

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L20)

## :books: UnresolvedInjectionError

Error thrown when no provider is found for a requested injection type.

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L30)

## :books: CircularDependencyInjectionError

Error thrown when a circular dependency is detected during the injection process.

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L40)

## :books: InjectionContextInstance

Represents an injection context that manages providers and their instances.
Allows for dependency resolution and instance creation.

Examples:

```ts
const context = new InjectionContextInstance([
  { provide: MyService, useClass: MyServiceImpl },
  { provide: 'API_URL', useValue: 'https://api.example.com' },
]);

const myService = context.get(MyService);
const apiUrl = context.get('API_URL');
```


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L64)

### Constructors

`public`: Creates an instance of InjectionContextInstance.

Parameters:

* `providers`: - An array of providers to register in the context.
* `name`: - The name of the injection context.
* `instances`: - A map of pre-existing instances.


### Static Methods

- [fromContext](#page_facing_up-fromcontext)

#### :gear: fromContext

| Method | Type |
| ---------- | ---------- |
| `fromContext` | `(context: InjectionContextInstance, providers: Provider[]) => InjectionContextInstance` |

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L187)

### Methods

- [getProviders](#page_facing_up-getproviders)
- [getInstance](#page_facing_up-getinstance)
- [addProvider](#page_facing_up-addprovider)
- [get](#page_facing_up-get)

#### :gear: getProviders

Gets all registered providers in the context.

| Method | Type |
| ---------- | ---------- |
| `getProviders` | `() => MapIterator<Provider>` |

Returns:

An iterable of providers.

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L86)

#### :gear: getInstance

Gets the map of instances in the context.

| Method | Type |
| ---------- | ---------- |
| `getInstance` | `() => Map<InjectionType<unknown>, unknown>` |

Returns:

A map of instances.

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L94)

#### :gear: addProvider

Adds a provider to the context.

| Method | Type |
| ---------- | ---------- |
| `addProvider` | `(provider: Provider) => void` |

Parameters:

* `provider`: - The provider to add.


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L102)

#### :gear: get

Resolves and retrieves an instance for the given injection token.

| Method | Type |
| ---------- | ---------- |
| `get` | `<T, O extends boolean or undefined>(token: InjectionType<T>, optional?: O or undefined) => IsOptional<O, T>` |

Parameters:

* `token`: - The injection token or class to resolve.
* `optional`: - Whether the injection is optional.


Returns:

The resolved instance or null if optional and not found.

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/injection-context.ts#L113)
