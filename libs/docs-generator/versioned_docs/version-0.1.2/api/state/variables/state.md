# Variable: state

<div class="api-package">Imported from <code>@react-logic/state</code></div>


<div class="api-signature">

> `const` **state**: \{\<`T`\>(): \{(): `T` \| `undefined`; (`value`): `void`; \}; \<`T`\>(`initialValue`): \{(): `T`; (`value`): `void`; \}; \} = `signal`

</div>

<div class="api-sources">

Defined in: [state/src/lib/state.ts:158](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/state/src/lib/state.ts#L158)

</div>

Creates a reactive piece of state — a getter/setter function backed by a
signal. Reading inside an effect (or a `useLogic` tracking pass) registers
a subscription; writing notifies subscribers.

The returned function plays both roles:
- `s()` reads the current value.
- `s(next)` writes a new value.

Place `state()` calls on logic-class fields. `useLogic` walks the
instance, recognises signal-shaped fields, and re-renders the component
when any of them change.

## Call Signature

<div class="api-signature">

> \<`T`\>(): \{(): `T` \| `undefined`; (`value`): `void`; \}

</div>

### Type Parameters

#### T

`T`

### Returns

\{(): `T` \| `undefined`; (`value`): `void`; \}

## Call Signature

<div class="api-signature">

> \<`T`\>(`initialValue`): \{(): `T`; (`value`): `void`; \}

</div>

### Type Parameters

#### T

`T`

### Parameters

<div class="api-parameters">

#### initialValue

`T`

</div>

### Returns

\{(): `T`; (`value`): `void`; \}

## Type Param

The value type held by the signal. Inferred from `initialValue`.

## Param

The initial value of the state.

## Returns

A function to get (no args) or set (one arg) the state value.

## Example

```ts
class Counter {
  count = state(0);
  inc() { this.count(this.count() + 1); }
}
```
