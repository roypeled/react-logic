# Function: computedState()

<div class="api-package">Imported from <code>@react-logic/state</code></div>


<div class="api-signature">

> **computedState**\<`F`\>(`fn`): `ComputedReturn`\<`F`\>

</div>

<div class="api-sources">

Defined in: [state/src/lib/state.ts:218](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/state/src/lib/state.ts#L218)

</div>

Plain derivation — call `c()` to read the latest value.

**Input variant** — if `fn` takes one parameter, `computedState` wraps an
internal signal as the input. The returned function is dual-purpose:
`c()` reads the derived value, `c(input)` writes the input. The signal
starts as `undefined`, so the parameter must accept `undefined`:

- `(q: string | undefined) => …` — explicit, handle the undefined case
  inside the body.
- `(q = '') => …` — default-arg syntax. The default value is what the
  callback sees on the first read.

A bare `(q: string) => …` (no default, no `| undefined`) is a type error
— the runtime would otherwise crash on the first read.

## Type Parameters

### F

`F` *extends* (...`args`) => `unknown`

The callback's full signature; the return shape (plain
  getter vs. getter/setter) is picked off `Parameters<F>`.

## Parameters

<div class="api-parameters">

### fn

`F`

A function that returns the computed value, optionally from a
  wrapped input.

</div>

## Returns

`ComputedReturn`\<`F`\>

Either a getter `() => T` (zero-param `fn`) or a dual
  getter/setter `InputComputed<I, T>` (one-param `fn`).

## Examples

```ts
class Cart {
  items = state<Item[]>([]);
  total = computedState(() => this.items().reduce((s, i) => s + i.price, 0));
}
```

```ts
class Search {
  pattern = computedState((q = '') => new RegExp(q, 'i'));
}
const s = new Search();
s.pattern('foo'); // void — sets the input
s.pattern();      // RegExp(/foo/i)
```
