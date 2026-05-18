# Type Alias: InjectorProviderProps

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **InjectorProviderProps** = `PropsWithChildren` & [`InjectionProvidersConfig`](InjectionProvidersConfig.md)

</div>

<div class="api-sources">

Defined in: [di/src/lib/types.ts:125](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/types.ts#L125)

</div>

Props for `<Injector>` — providers plus React children. Use this if you
write a wrapper component that forwards props to `<Injector>` so the
children/providers types stay correct.
