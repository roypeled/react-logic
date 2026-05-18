# Type Alias: Provider

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **Provider**\<`T`\> = `ValueProvider`\<`T`\> \| `ClassProvider`\<`T`\> \| `FactoryProvider`\<`T`\>

</div>

<div class="api-sources">

Defined in: [di/src/lib/types.ts:86](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/types.ts#L86)

</div>

Tells the DI container how to produce an instance for a given token. Three
kinds:

- **Value provider** — supply a pre-built value. Used for primitives,
  pre-existing service instances, configuration objects.
- **Class provider** — give the container a class to instantiate when the
  token is first requested. The instance is cached for the lifetime of the
  scope.
- **Factory provider** — run a function to produce the value. Useful when
  construction needs control flow or asynchronous setup that doesn't fit a
  plain constructor.

For all three, the result is cached per-scope: every consumer of the token
within the same scope receives the same instance/value. Disposal happens
when the scope's `<Injector>` unmounts (or on HMR for the global scope).

## Type Parameters

### T

`T` = `unknown`

The type of the provided dependency.

## Example

```ts
const valueProvider: Provider<string> = {
  provide: API_URL,
  useValue: 'https://api.example.com',
};

const classProvider: Provider<MyService> = {
  provide: MyService,
  useClass: MyServiceImpl,
};

const factoryProvider: Provider<MyService> = {
  provide: MyService,
  useFactory: () => new MyServiceImpl(loadConfig()),
};
```
