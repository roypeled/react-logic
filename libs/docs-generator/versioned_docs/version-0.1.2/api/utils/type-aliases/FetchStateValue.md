# Type Alias: FetchStateValue

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **FetchStateValue**\<`T`\> = \{ `failed`: `false`; `idle`: `true`; `loading`: `false`; \} \| \{ `failed`: `false`; `idle`: `false`; `loading`: `true`; \} \| \{ `failed`: `false`; `idle`: `false`; `loading`: `false`; `result`: `T`; `status`: `number`; \} \| \{ `error`: `Error`; `failed`: `true`; `idle`: `false`; `loading`: `false`; `status?`: `number`; \}

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:34](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L34)

</div>

The value carried by a `fetchState` / `fetchState.callable` signal. A
discriminated union with four variants — branch on `idle` / `loading` /
`failed`, then read `result` / `error` / `status`.

```ts
const s = data();
if (s.idle) return <button>Start</button>;          // callable, never fired
if (s.loading) return <Spinner />;
if (s.failed) return <Error message={s.error.message} status={s.status} />;
return <List items={s.result} httpStatus={s.status} />;
```

**`idle`** — only emitted by `fetchState.callable` before its first
`.fetch(...)`. Reactive `fetchState` skips this state: the build
callback fires immediately, so the initial value is `loading`.

**`status`** — HTTP status code. Present on success. Present on failed
only when the request reached a response (`parse` threw, non-2xx
default-parse rejected, etc.). Absent on pure network failures (CORS,
DNS, fetch threw before a response existed).

## Type Parameters

### T

`T`

The parsed response type.
