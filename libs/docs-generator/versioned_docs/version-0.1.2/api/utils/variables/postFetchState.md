# Variable: postFetchState

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> `const` **postFetchState**: [`FetchStateMethodPreset`](../interfaces/FetchStateMethodPreset.md)

</div>

<div class="api-sources">

Defined in: [utils/src/lib/fetch-state.ts:643](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/fetch-state.ts#L643)

</div>

POST-flavoured `fetchState`. Reactive by default (tracks the build
callback's signal reads); `.callable` is the imperative companion.

```ts
// Reactive — e.g. a GraphQL query that re-fires when its input changes.
const profile = postFetchState((id = '') => ({
  url: '/graphql',
  body: { query: USER_QUERY, variables: { id } },
}));

// Imperative — typical mutation.
const submit = postFetchState.callable((message: string) => ({
  url: '/api/comments',
  body: { message },
}));
submit.fetch('hello world');
```
