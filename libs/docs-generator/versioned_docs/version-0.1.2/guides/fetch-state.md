---
sidebar_position: 4
---

# Fetch state

Reactive state for HTTP requests. One helper, two modes:

- **`fetchState(build, config?)`** — reactive. The build callback is tracked, and the request re-fires when its inputs change.
- **`fetchState.callable(build, config?)`** — imperative. The build callback only runs when you call `.fetch(...)`.

Both share the same accessor, the same state machine, the same body handling, and the same pluggable transport.

## The accessor

Both modes return an accessor with the same call shape:

```ts
data()                 // read FetchStateValue<T>
data.fetch(...args)    // fire a request with these args
data.fetch()           // re-fire with the current input / last args
```

## The state shape

```ts
type FetchStateValue<T> =
  | { idle: true;  loading: false; failed: false }
  | { idle: false; loading: true;  failed: false }
  | { idle: false; loading: false; failed: false; status: number; result: T }
  | { idle: false; loading: false; failed: true;  status?: number; error: Error };
```

Four variants. Branch on `idle`, `loading`, or `failed`, then read `result`, `error`, or `status`. TypeScript narrows correctly:

```tsx
const Profile = () => {
  const l = useLogic(UserProfile);
  const s = l.data();
  if (s.idle) return <button onClick={() => l.data.fetch('react')}>Start</button>;
  if (s.loading) return <Spinner />;
  if (s.failed) return <Error message={s.error.message} status={s.status} />;
  return <UserCard user={s.result} httpStatus={s.status} />;
};
```

**`idle`** — "nothing has been requested yet." You only see it when using `fetchState.callable`, before the first `.fetch(...)` call. Reactive `fetchState` starts in `loading` and never goes through `idle`.

**`status`** — HTTP status code from the response. Always present on success. Present on failed only when the request reached a response (`parse` threw, a non-2xx response, etc.). Absent on pure network failures (CORS, DNS, fetch threw before a response existed).

### Narrowing patterns

Boolean narrowing works cleanly for the three "did something happen" states:

```ts
if (s.idle) { /* not fired yet */ }
if (s.loading) { /* in flight */ }
if (s.failed) { /* error */ }
// the remaining variant is success — s.result and s.status are available
```

For "only show the result when there is one," `'result' in s` is the right check:

```ts
if ('result' in s) {
  // success only — both idle and failed lack `result`
  return <List items={s.result} />;
}
```

## The build callback

Both modes accept a build callback that returns one of:

- **a URL string** — shorthand for a GET to that URL,
- **a `FetchStateRequest` object** — `{ url, method?, headers?, body?, parse?, fetcher?, … }` when you need anything beyond a GET,
- **`null`, `undefined`, or an empty string** — *only meaningful in reactive `fetchState`*. Skip the fetch this time. State stays as it was.

The optional second argument supplies **static defaults** merged into every request. Per-call values win on conflict. `headers` are deep-merged, so a default `Authorization` survives a per-call `Content-Type`.

```ts
// Bare URL — simple GET.
fetchState((q = '') => q ? `/search?q=${q}` : null);

// Per-call descriptor — vary method/body/headers per call.
fetchState(() => ({
  url: '/items',
  headers: { 'X-Trace': trace() },
}));

// Static defaults from the second arg — applied to every request.
fetchState(
  (q = '') => `/search?q=${q}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

## fetchState — reactive

Any signal the build callback reads becomes a dependency. When one changes, the fetch fires again with the new value and any in-flight request is aborted.

```ts
import { state } from '@react-logic/react-logic';
import { fetchState } from '@react-logic/utils';

class Search {
  query  = state('');
  region = state('us');

  results = fetchState(() => {
    const q = this.query();    // tracked
    const r = this.region();   // tracked
    return q ? `/search?q=${encodeURIComponent(q)}&region=${r}` : null;
  });
}
```

Writing to `query` or `region` triggers a new fetch. The `q ? … : null` pattern returns `null` to skip the request entirely when the query is empty (the state stays in its previous value).

The build callback can also take arguments — `fetchState((q, page) => …)` — and you write to them via `.fetch(q, page)`. Use the args form when the values driving the fetch don't need to be displayed in the UI on their own; the args are stored internally and aren't accessible from the returned fetch-state object. If a component needs to render the current query (or any other driver) directly, keep it in its own `state()` and read it inside the callback instead.

```ts
class Search {
  // args form — the query is internal to the fetch; nothing else reads it.
  results = fetchState((q = '', page = 1) =>
    q ? `/search?q=${encodeURIComponent(q)}&page=${page}` : null
  );
}

logic.results.fetch('react', 2);   // sets the args and fires
logic.results.fetch();             // re-fires with the same args
```

### Three ways to write the build callback

Pick whichever matches your data flow:

**No args.** Reads outer signals. `.fetch()` re-runs the request with the current values.

```ts
fetchState(() => `/users/${this.userId()}`);
```

**Args with a default.** The default value seeds the initial run, and the callback can assume the arg is defined.

```ts
fetchState((page = 1) => `/items?page=${page}`);
```

**Args without a default.** The initial value is `undefined`, so the callback has to handle that explicitly. Return `null` to skip the fetch until something calls `.fetch(value)`.

```ts
fetchState((id: string | undefined) =>
  id ? `/users/${id}` : null
);
```

Don't write `(id: string) => …` without `| undefined` or a default — TypeScript will error because the initial value really is undefined.

## fetchState.callable — imperative

Reactive mode is wrong for mutations and one-off triggers. There's no signal whose change should fire a POST. `.callable` flips the control. The build callback only runs when you call `.fetch(...)`. Signals read inside the build are **not** tracked.

```ts
import { fetchState } from '@react-logic/utils';

class Comments {
  // Object form — body varies per call.
  post = fetchState.callable((message: string) => ({
    url: '/api/comments',
    method: 'POST',
    body: { message },   // plain object — auto-stringified
  }));

  // URL-string shortcut — imperative GET.
  fetchOne = fetchState.callable((id: string) => `/api/comments/${id}`);
}
```

Operations:

- `post()` — read the current `FetchStateValue`. Never fires a request.
- `post.fetch('hello world')` — fire a request. Aborts any in-flight call.
- `post.fetch()` — re-run the most recent `.fetch(...)` with the same args. Does nothing before the first `.fetch(...)`.

```tsx
const SubmitBox = () => {
  const c = useLogic(Comments);
  const s = c.post();
  return (
    <>
      <button onClick={() => c.post.fetch(draft)} disabled={s.loading}>
        Post
      </button>
      {s.failed && <span>Failed: {s.error.message}</span>}
      {'result' in s && <span>Posted ✓</span>}
      {s.idle && <span className="hint">Type a message and submit</span>}
    </>
  );
};
```

Initial state is `{ idle: true, loading: false, failed: false }`. The request hasn't been fired yet. The first `.fetch(...)` transitions to loading. The resolve transitions to success or failed. UIs can branch on `idle` to show a "start" button or empty state, separate from the loading spinner.

## Verb helpers — postFetchState / putFetchState / deleteFetchState

Shorthand for `fetchState` with the HTTP method baked in. Each helper preserves the full API: the helper itself is reactive, and `.callable` is the imperative companion. The method is just pre-set:

```ts
import { postFetchState, putFetchState, deleteFetchState } from '@react-logic/utils';

// Reactive POST — typical for GraphQL queries (POSTing on key change).
const profile = postFetchState((id = '') => ({
  url: '/graphql',
  body: { query: USER_QUERY, variables: { id } },
}));
profile.fetch('user-42');
profile();   // FetchStateValue

// Imperative mutation.
const submit = postFetchState.callable((message: string) => ({
  url: '/api/comments',
  body: { message },
}));
submit.fetch('hello');

// PUT / DELETE follow the same pattern.
const update = putFetchState.callable((id: string, body: Patch) => ({ url: `/items/${id}`, body }));
const remove = deleteFetchState.callable((id: string) => `/items/${id}`);
```

The per-call object still wins on conflict. `postFetchState.callable(() => ({ url, method: 'PATCH' }))` will PATCH, despite the helper's name. The helper's preset is the default, not a lock.

`fetchState` itself defaults to GET when no method is given. Pass `method` in the config or the build-callback object to override.

## Config

The second argument to either form (and the object a build callback may return) share the same shape:

```ts
interface FetchStateConfig<T> extends Omit<RequestInit, 'signal' | 'window' | 'body'> {
  body?:    BodyInit | object | null;
  parse?:   (response: FetchResponse) => Promise<T>;
  fetcher?: FetchAdapter;
}
```

Standard `RequestInit` fields (`method`, `headers`, `credentials`, `mode`, `cache`, `referrerPolicy`, …) pass through unchanged. `signal` is set automatically. Don't pass your own.

### Body auto-stringify

Plain objects and arrays are JSON-stringified automatically. `Content-Type: application/json` is added if the headers don't already include one. Standard `BodyInit` values (`string`, `FormData`, `Blob`, `URLSearchParams`, `ArrayBuffer`, `ReadableStream`) pass through untouched.

```ts
// Auto: body becomes '{"name":"alice"}', headers gets the JSON Content-Type.
fetchState.callable((name: string) => ({
  url: '/users',
  method: 'POST',
  body: { name },
}));

// Untouched: FormData has its own multipart encoding; the browser sets
// the Content-Type with the boundary.
fetchState.callable((file: File) => {
  const fd = new FormData();
  fd.append('upload', file);
  return { url: '/upload', method: 'POST', body: fd };
});
```

### parse

`parse` turns the response into the value. Default behavior:

```ts
const defaultParse = async (r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);  // → failed with status
  return r.json();
};
```

Override when you need text/blob, a typed parser, or a custom non-2xx policy:

```ts
results = fetchState(
  (q = '') => `/search?q=${q}`,
  { parse: (r) => r.json() as Promise<SearchResult[]> }
);
```

Throwing inside `parse` puts the state into failed with that error and the response's `status`.

### fetcher

A per-call HTTP adapter that overrides the global one set via `setFetchStateAdapter`. Useful for one-off requests through a different axios instance, a mock client in a test, or a special transport.

## Pluggable transport — `setFetchStateAdapter`

Every fetch goes through a `FetchAdapter`. The default wraps `globalThis.fetch`. Swap it once at app start to route every reactive fetch through your HTTP client of choice (axios with interceptors, auth headers, base URL, retries, etc.).

```ts
import axios from 'axios';
import { setFetchStateAdapter, createAxiosFetchAdapter } from '@react-logic/utils';

setFetchStateAdapter(createAxiosFetchAdapter(axios));
```

After that, every `fetchState(...)` and `fetchState.callable(...)` call uses axios.

### The axios adapter

`createAxiosFetchAdapter(axios)` takes an axios-compatible client (axios itself, an `axios.create({...})` instance, or anything structurally equivalent) and returns a `FetchAdapter`. The adapter:

- Forces raw-text mode (`responseType: 'text'`, identity `transformResponse`) so `parse`'s `json()` and `text()` behave the same as native `fetch`.
- Sets `validateStatus: null` so axios doesn't throw on non-2xx. Non-success responses surface via `ok: false` on the wrapped response.
- Forwards `method`, `headers`, `body`, and `signal` from the wrapper to axios.

```ts
const adapter = createAxiosFetchAdapter(
  axios.create({
    baseURL: '/api',
    headers: { 'X-Client': 'react-logic' },
  })
);
setFetchStateAdapter(adapter);
```

Axios is **not** a hard dependency of `@react-logic/utils`. You pass your own instance in.

### Custom adapters

`FetchAdapter` is a single-function interface:

```ts
type FetchAdapter = (
  url: string,
  init: Omit<RequestInit, 'signal' | 'window'> & { signal: AbortSignal }
) => Promise<FetchResponse>;

interface FetchResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}
```

Implement it for any HTTP client: `ky`, `got`, an internal RPC layer, or a mock for tests.

## Cancellation

Both modes create an `AbortController` per request. The previous request's controller is aborted whenever:

- `.fetch(...)` or `.fetch()` is called.
- For reactive `fetchState`, a tracked signal that the build callback reads changes.
- The owning logic class or service is disposed.

Aborted requests don't change state. The new fetch's transitions take over.

## Which one do I use?

**`fetchState`** — for reads that should fire automatically when their inputs change. Search-as-you-type, "load this user when the route changes," anything where the request is a function of state. Gives you loading / failed / success branches and cancels the previous request when a new one fires.

**`fetchState.callable`** — for requests that should only happen on demand. POST / PUT / DELETE, "submit this form," "retry this." Same state shape and cancellation as the reactive form; you decide when to fire by calling `.fetch(...)`.

**`asyncState`** — for async work that isn't an HTTP request, or where you want a plain `T | undefined` value instead of a tagged-union state. No built-in cancellation, no HTTP status, no body handling — just a signal whose value comes from an async function.

## See also

- [Async state](./async-state) — when the function does more than fetch.
- [Reactive state](./reactive-state) — `effect` and `state`, the building blocks this helper is built on.
