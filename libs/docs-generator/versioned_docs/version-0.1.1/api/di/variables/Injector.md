# Variable: Injector

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> `const` **Injector**: `FunctionComponent`\<[`InjectorProviderProps`](../type-aliases/InjectorProviderProps.md)\>

</div>

<div class="api-sources">

Defined in: [di/src/lib/injector-provider.tsx:66](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/injector-provider.tsx#L66)

</div>

Provides a new injection scope to its children, optionally extending the
surrounding scope with additional providers. Services constructed in this
scope are torn down when the Injector unmounts.

## Example

```tsx
<Injector provide={[CounterStore, { provide: API_URL, useValue: '/api' }]}>
  <App />
</Injector>
```
