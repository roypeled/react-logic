# Function: batch()

<div class="api-package">Imported from <code>@react-logic/state</code></div>


<div class="api-signature">

> **batch**\<`T`\>(`fn`): `T`

</div>

<div class="api-sources">

Defined in: [state/src/lib/state.ts:53](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/state/src/lib/state.ts#L53)

</div>

Coalesce multiple signal writes into a single notification pass. Inside
the callback, subscribers (effects, `useLogic` re-renders) don't fire on
each individual write — they fire once at the end with the final values.

Nests safely (uses alien-signals' depth counter under the hood) and runs
the final flush in a `try`/`finally`, so a thrown exception inside the
callback still closes the batch.

**Use it when:**
- A method writes several related fields and you want consumers to see
  one consistent snapshot, not an intermediate state with only half
  updated.
- You're applying a list of changes in a loop and want to avoid the
  re-render storm.

**Don't use it when:**
- The writes are already sequential within a single synchronous callback
  that doesn't itself read signals between writes — alien-signals already
  coalesces those at the React render boundary.

## Type Parameters

### T

`T`

The callback's return type, forwarded through.

## Parameters

<div class="api-parameters">

### fn

() => `T`

The work to perform inside the batch.

</div>

## Returns

`T`

Whatever `fn` returns.

## Example

```ts
class Form {
  name = state('');
  email = state('');
  age = state(0);

  reset() {
    batch(() => {
      this.name('');
      this.email('');
      this.age(0);
    });
    // Subscribers see exactly one update with all three values reset.
  }
}
```
