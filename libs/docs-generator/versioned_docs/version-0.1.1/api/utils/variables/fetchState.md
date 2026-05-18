# Variable: fetchState

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> `const` **fetchState**: \{\<`F`, `T`\>(`build`, `config?`): `ReactiveReturn`\<`F`, `T`\>; `callable`: \<`Args`, `T`\>(`build`, `config?`) => [`FetchStateAccessor`](../type-aliases/FetchStateAccessor.md)\<`T`, `Args`\>; \}

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:530](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L530)

</div>

Reactive fetch with cancellation, a discriminated loading/result/error
state, and HTTP status on success/failed.

The build callback returns either a URL string (shorthand for a GET) or
a full `FetchStateRequest` descriptor. Returning `null` / `undefined` /
empty string skips the fetch for that tick. The optional second argument
supplies static defaults merged into every request — per-call wins on
conflict; headers deep-merge.

**Reactive (the default):** the build callback tracks every signal it
reads. The fetch re-fires whenever a tracked signal changes.

```ts
// No input — depends on outer signals.
data = fetchState(() => {
  const id = this.userId();
  return id ? `/users/${id}` : null;
});
data();          // → FetchStateValue
data.fetch();    // → re-fetch (same URL, current signals)

// Input variant — `.fetch(v)` writes the wrapped input signal,
// re-triggering the build with the new value.
results = fetchState((q = '') => q ? `/search?q=${q}` : null);
results.fetch('react');   // sets input, fires
results.fetch();          // refetch with current input
results();                 // → FetchStateValue
```

**Imperative** — see [fetchState.callable](#callable). The build callback
only runs when you call `.fetch(...)`; no signal tracking. The right
shape for mutations and one-off triggers.

## Type Declaration

## Type Parameters

### F

`F` *extends* (...`args`) => [`FetchStateBuilderResult`](../type-aliases/FetchStateBuilderResult.md)\<`T`\>

The build-callback signature.

### T

`T` = `unknown`

The parsed response type.

## Parameters

<div class="api-parameters">

### build

`F`

### config?

[`FetchStateConfig`](../interfaces/FetchStateConfig.md)\<`T`\>

</div>

## Returns

`ReactiveReturn`\<`F`, `T`\>

### callable

<div class="api-signature">

> **callable**: \<`Args`, `T`\>(`build`, `config?`) => [`FetchStateAccessor`](../type-aliases/FetchStateAccessor.md)\<`T`, `Args`\>

</div>

Imperative companion. The build callback only runs when `.fetch(...)`
is called — never reactively. Same accessor shape as the reactive form.

```ts
const postComment = fetchState.callable((message: string) => ({
  url: '/api/comments',
  method: 'POST',
  body: { message },     // plain object — auto-stringified
}));

postComment.fetch('hello world');   // fires the request
postComment();                       // reads FetchStateValue
postComment.fetch();                 // re-runs with 'hello world'
```

Calling `.fetch(...)` again before the previous request resolves
aborts the previous in-flight request. A no-arg `.fetch()` before any
`.fetch(...args)` is a no-op (no args to fire with).

#### Type Parameters

##### Args

`Args` *extends* readonly `unknown`[]

The build callback's argument tuple.

##### T

`T` = `unknown`

The parsed response type.

#### Parameters

<div class="api-parameters">

##### build

(...`args`) => `string` \| [`FetchStateRequest`](../interfaces/FetchStateRequest.md)\<`T`\>

##### config?

[`FetchStateConfig`](../interfaces/FetchStateConfig.md)\<`T`\>

</div>

#### Returns

[`FetchStateAccessor`](../type-aliases/FetchStateAccessor.md)\<`T`, `Args`\>
