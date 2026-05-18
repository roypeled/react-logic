# Function: onDestroy()

<div class="api-package">Imported from <code>@react-logic/di</code></div>


<div class="api-signature">

> **onDestroy**(`fn`): `void`

</div>

<div class="api-sources">

Defined in: [di/src/lib/lifecycle.ts:27](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/di/src/lib/lifecycle.ts#L27)

</div>

Register a callback to run when the surrounding construction scope is torn
down. Must be called synchronously during a logic class or service
constructor (or as a field initializer). Throws otherwise.

For logic classes, the callback fires when the consuming component
unmounts. For services constructed via DI, it fires when the providing
`<Injector>` unmounts.

## Parameters

<div class="api-parameters">

### fn

() => `void`

</div>

## Returns

`void`

## Example

```ts
class TimeService {
  timer = state<ReturnType<typeof setInterval> | null>(null);
  constructor() {
    onDestroy(() => {
      const t = this.timer();
      if (t) clearInterval(t);
    });
  }
}
```
