# Class: InjectionToken

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-sources">

Defined in: [di/src/lib/injection-token.ts:33](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/injection-token.ts#L33)

</div>

An opaque, type-tagged identity used to register and resolve a dependency
in the DI container.

Use an `InjectionToken` when the dependency has no class identity:
configuration strings, primitive values, plain function callbacks,
environment-specific objects, etc. For dependencies that *are* classes,
the class itself doubles as the token — no `InjectionToken` is needed.

Each `InjectionToken` instance is unique by reference. The `description`
is for debugging only — two tokens constructed with the same description
are *different* tokens. Token identity is what makes `provide`/`inject`
pairs match.

## Example

```ts
export const API_URL = new InjectionToken<string>('API_URL');

// Provide a value for it…
<Injector provide={[{ provide: API_URL, useValue: 'https://api.test' }]}>
  <App />
</Injector>

// …then inject inside any logic class:
class ApiClient {
  url = inject(API_URL);
}
```

## Type Parameters

### T

`T`

The type that consumers receive when injecting this token.
  Phantom-only — the runtime value carries no `T`.

## Constructors

### Constructor

<div class="api-signature">

> **new InjectionToken**\<`T`\>(`description?`): `InjectionToken`\<`T`\>

</div>

<div class="api-sources">

Defined in: [di/src/lib/injection-token.ts:38](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/injection-token.ts#L38)

</div>

#### Parameters

<div class="api-parameters">

##### description?

`string` = `'unnamed'`

</div>

#### Returns

`InjectionToken`\<`T`\>

## Properties

### description

<div class="api-signature">

> **description**: `string` = `'unnamed'`

</div>

<div class="api-sources">

Defined in: [di/src/lib/injection-token.ts:38](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/injection-token.ts#L38)

</div>

## Methods

### toString()

<div class="api-signature">

> **toString**(): `string`

</div>

<div class="api-sources">

Defined in: [di/src/lib/injection-token.ts:41](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/injection-token.ts#L41)

</div>

#### Returns

`string`
