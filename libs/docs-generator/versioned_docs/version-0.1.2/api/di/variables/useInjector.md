# Variable: useInjector

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> `const` **useInjector**: `UseInjectorFn`

</div>

<div class="api-sources">

Defined in: [di/src/lib/injector-provider.tsx:115](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/injector-provider.tsx#L115)

</div>

Resolves a dependency from the surrounding `<Injector>` scope, scoped to
the React subtree where it's called.

Use this when a *React component* (not a logic class) needs to read a
service directly. Inside logic classes, prefer `inject()` — it's
synchronous, doesn't need a hook, and is what `<useLogic>` is designed to
orchestrate.

The hook does not subscribe to the resolved value's signals. If you need
the component to re-render when the service's state changes, call the
relevant signal directly inside the render body (e.g. `svc.count()`) — the
hook order around it is irrelevant.

## Type Param

The type the token resolves to. With `optional: true` the
  return widens to `T | null`.

## Example

```tsx
// Required injection — throws if no provider is found.
const myService = useInjector(MyService);

// Optional — returns null if no provider is found.
const maybeService = useInjector(MyService, true);
```
