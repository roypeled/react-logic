
## :abc: Types

- [Class](#page_facing_up-class)
- [InjectionType](#page_facing_up-injectiontype)
- [Provider](#page_facing_up-provider)
- [InjectionProvidersConfig](#page_facing_up-injectionprovidersconfig)
- [InjectorProviderProps](#page_facing_up-injectorproviderprops)

### :gear: Class

A class type that can be instantiated.

| Type | Type |
| ---------- | ---------- |
| `Class` | `new () => T` |

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/types.ts#L7)

### :gear: InjectionType

An injection type that can be used as a token for dependency injection.

| Type | Type |
| ---------- | ---------- |
| `InjectionType` | `InjectionToken<T> or Class<T>` |

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/types.ts#L12)

### :gear: Provider

A provider for dependency injection, which can be a value, class, or factory provider.

| Type | Type |
| ---------- | ---------- |
| `Provider` | `ValueProvider<T> or ClassProvider<T> or FactoryProvider<T>` |

Examples:

```ts
const valueProvider: ValueProvider<MyService> = {
  provide: MyService,
  useValue: new MyServiceImpl(),
};

const classProvider: ClassProvider<MyService> = {
  provide: MyService,
  useClass: MyServiceImpl,
};

const factoryProvider: FactoryProvider<MyService> = {
  provide: MyService,
  useFactory: () => new MyServiceImpl(),
};
```


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/types.ts#L51)

### :gear: InjectionProvidersConfig

Configuration for injection providers.
It includes an optional array of providers to extend the injection context.

| Type | Type |
| ---------- | ---------- |
| `InjectionProvidersConfig` | `{ provide?: Provider[]; }` |

Parameters:

* `provide`: - Optional array of providers to add to the injection context.


[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/types.ts#L58)

### :gear: InjectorProviderProps

Props for the Injector component.
It extends the InjectionProvidersConfig and includes children components.

| Type | Type |
| ---------- | ---------- |
| `InjectorProviderProps` | `PropsWithChildren and InjectionProvidersConfig` |

[:link: Source](https://github.com/peterpeterparker/tsdoc-markdown/tree/main/libs/di/src/lib/types.ts#L66)

