# Type Alias: FetchStateAccessor

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **FetchStateAccessor**\<`T`, `Args`\> = () => [`FetchStateValue`](FetchStateValue.md)\<`T`\> & `object`

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:333](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L333)

</div>

Reactive / imperative fetch accessor. `()` reads the state; `.fetch`
either fires a new request with the given args (writing the wrapped
input signal for reactive, running the build callback for imperative)
or — when called with no args — re-runs the last request.

## Type Declaration

### \[REACTIVE\_ACCESSOR\_MARKER\]

<div class="api-signature">

> **\[REACTIVE\_ACCESSOR\_MARKER\]**: `true`

</div>

### fetch

<div class="api-signature">

> **fetch**: \{(...`args`): `void`; (): `void`; \}

</div>

Fire a request with the given arguments. With no arguments, re-fire
the last request — current input for reactive, most recent
`.fetch(...)` args for imperative.

#### Call Signature

<div class="api-signature">

> (...`args`): `void`

</div>

##### Parameters

<div class="api-parameters">

###### args

...`Args`

</div>

##### Returns

`void`

#### Call Signature

<div class="api-signature">

> (): `void`

</div>

##### Returns

`void`

## Type Parameters

### T

`T`

The parsed response type.

### Args

`Args` *extends* readonly `unknown`[]

The build callback's argument tuple. `[]` for the
  0-param reactive form.
