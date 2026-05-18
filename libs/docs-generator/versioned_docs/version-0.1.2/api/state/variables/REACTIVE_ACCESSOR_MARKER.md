# Variable: REACTIVE_ACCESSOR_MARKER

<div class="api-package">Imported from <code>@react-logic/state</code></div>


<div class="api-signature">

> `const` **REACTIVE\_ACCESSOR\_MARKER**: *typeof* `REACTIVE_ACCESSOR_MARKER`

</div>

<div class="api-sources">

Defined in: [state/src/lib/state.ts:116](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/state/src/lib/state.ts#L116)

</div>

Brand used by `@react-logic/core`'s `useLogic` tracking pass to recognise
plain-function wrappers that internally subscribe to alien-signals
signals — `computedState`'s dual getter/setter, `fetchState` (in
`@react-logic/utils`), and any future reactive accessor. alien-signals'
`isComputed`/`isSignal` only match its own `bind`-produced functions, so
without this brand the framework would skip the field and never
subscribe to its updates.

Use `Symbol.for` so the contract crosses package boundaries without an
import: any package can mark its wrappers with this brand, and core
recognises them uniformly.
