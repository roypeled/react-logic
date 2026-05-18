---
sidebar_position: 4
---

# Fetch state

HTTP-shaped reactive state. One helper, two modes:

- **`fetchState(build, config?)`** — reactive: the build callback is tracked, the request re-fires when its inputs change.
- **`fetchState.callable(build, config?)`** — imperative: the build callback only runs when you call `.fetch(...)`.

Both share the same accessor surface, the same state machine, the same body normalisation, the same pluggable transport.

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

Four variants. Branch on `idle` / `loading` / `failed`, then read `result` / `error` / `status`. TypeScript narrows correctly:

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

**`idle`** — only emitted by `fetchState.callable` before its first `.fetch(...)`. Reactive `fetchState` skips this state: the build callback fires immediately on construction, so the initial value is `loading`. The `idle` branch in reactive consumer code is dead code (TypeScript still allows it; runtime never reaches it).

**`status`** — HTTP status code from the response. Always present on success. Present on failed only when the request reached a response (`parse` threw, non-2xx default-parse rejected, etc.). Absent on pure network failures (CORS, DNS, fetch threw before a response existed).

### Narrowing patterns

Boolean narrowing collapses cleanly for the three "did something happen" states:

```ts
if (s.idle) { /* not fired yet */ }
if (s.loading) { /* in flight */ }
if (s.failed) { /* error */ }
// remaining variant is the success one — s.result and s.status available
```

For "only show the result when there is one," `'result' in s` is the precise narrowing:

```ts
if ('result' in s) {
  // success only — both idle and failed lack `result`
  return <List items={s.result} />;
}
```

## The build callback

Both modes accept a build callback that returns one of:

- **a URL string** — shorthand for a GET to that URL,
- **a `FetchStateRequest` descriptor** — `{ url, method?, headers?, body?, parse?, fetcher?, … }` when you need anything beyond a GET,
- **`null` / `undefined` / empty string** — *only meaningful in reactive `fetchState`* — skip the fetch this tick; state stays where it is.

The optional second argument supplies **static defaults** merged into every request. Per-call values win on conflict; `headers` deep-merge so a default `Authorization` survives a per-call `Content-Type`.

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

Build callback tracks every signal it reads. The fetch re-fires whenever a tracked signal changes.

```ts
import { fetchState } from '@react-logic/utils';

class Search {
  results = fetchState((q = '') =>
    q ? `/search?q=${encodeURIComponent(q)}` : null
  );
}
```

Operations:

- `results()` — read the current `FetchStateValue`.
- `results.fetch('react')` — write the wrapped input signal. The tracked effect re-runs with the new value, aborting any in-flight request.
- `results.fetch()` — re-fire with the current input (same URL, same args).

### URL-function shapes

The build callback follows the same conditional-type rules as `computedState`:

| Callback | `.fetch` arg | Notes |
|---|---|---|
| `() => …` | none — only `.fetch()` (refetch) | depends on outer signals; `.fetch()` re-runs |
| `(q: I \| undefined) => …` | `I \| undefined` | reactive input variant |
| `(q = default) => …` | `I` (narrowed via default arg) | reactive input variant with seeded default |
| `(q: I) => …` | unsafe — TS error | wrapped signal starts undefined; callback must accept undefined |

## Verb helpers — postFetchState / putFetchState / deleteFetchState

Sugar over `fetchState` with the HTTP method baked in. Each helper preserves the full surface — the helper itself is reactive, `.callable` is the imperative companion — just with the method pre-set:

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

The per-call descriptor still wins on conflict — `postFetchState.callable(() => ({ url, method: 'PATCH' }))` will PATCH, despite the helper's name. The helper's preset is the default, not a lock.

`fetchState` itself defaults to GET when no method is given; pass `method` in the config or the build-callback descriptor to override.

## fetchState.callable — imperative

Reactive mode is wrong for mutations and one-off triggers — there's no signal whose change should fire a POST. `.callable` flips the control: the build callback only runs when the consumer calls `.fetch(...)`. Signals read inside the build are **not** tracked.

```ts
import { fetchState } from '@react-logic/utils';

class Comments {
  // Descriptor form — body varies per call.
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

- `post()` — read the current `FetchStateValue`. Never fires.
- `post.fetch('hello world')` — fire a request. Aborts any in-flight call.
- `post.fetch()` — re-run the most recent `.fetch(...)` with the same args. No-op before the first `.fetch(...)`.

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

Initial state is `{ idle: true, loading: false, failed: false }` — the request has not been fired yet. First `.fetch(...)` transitions to loading; the resolve transitions to success or failed. UIs can branch on `idle` to render a "start" button or empty state distinct from the loading spinner.

## Config

The second argument to either form (and the descriptor a build callback may return) share the same shape:

```ts
interface FetchStateConfig<T> extends Omit<RequestInit, 'signal' | 'window' | 'body'> {
  body?:    BodyInit | object | null;
  parse?:   (response: FetchResponse) => Promise<T>;
  fetcher?: FetchAdapter;
}
```

Standard `RequestInit` fields (`method`, `headers`, `credentials`, `mode`, `cache`, `referrerPolicy`, …) go straight through. `signal` is set automatically — don't pass your own.

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

`parse` turns the response into the value. Default behaviour:

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

Throwing inside `parse` lands in the failed state with that error and the response's `status`.

### fetcher

Per-call HTTP adapter, overriding the global one set via `setFetchStateAdapter`. Useful for one-off requests through a different axios instance, a mock client in a test, or a special transport.

## Pluggable transport — `setFetchStateAdapter`

Every fetch goes through a `FetchAdapter`. The default wraps `globalThis.fetch`; swap it once at app boot to route every reactive fetch through your HTTP client of choice (axios with interceptors, auth headers, base URL, retries, etc.).

```ts
import axios from 'axios';
import { setFetchStateAdapter, createAxiosFetchAdapter } from '@react-logic/utils';

setFetchStateAdapter(createAxiosFetchAdapter(axios));
```

After that, every `fetchState(...)` and `fetchState.callable(...)` call uses axios.

### The axios adapter

`createAxiosFetchAdapter(axios)` takes an axios-compatible client (axios itself, an `axios.create({...})` instance, or anything structurally equivalent) and returns a `FetchAdapter`. The adapter:

- Forces raw-text mode (`responseType: 'text'`, identity `transformResponse`) so `parse`'s `json()` / `text()` contract matches the native `fetch` behaviour.
- Sets `validateStatus: null` so axios doesn't throw on non-2xx — non-success responses surface via `ok: false` on the wrapped response.
- Forwards `method` / `headers` / `body` / `signal` from the wrapper to axios.

```ts
const adapter = createAxiosFetchAdapter(
  axios.create({
    baseURL: '/api',
    headers: { 'X-Client': 'react-logic' },
  })
);
setFetchStateAdapter(adapter);
```

Axios is **not** a hard dependency of `@react-logic/utils` — you pass your own instance in.

### Custom adapters

`FetchAdapter` is a 1-function interface:

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

Implement it for any HTTP client — `ky`, `got`, an internal RPC layer, a mock for tests.

## Cancellation

Both modes create an `AbortController` per request. The previous request's controller is aborted whenever:

- `.fetch(...)` or `.fetch()` is called.
- For reactive `fetchState`, a tracked signal that the build callback reads changes.
- The owning logic class or service is disposed.

Aborted requests never transition state — the new fetch's transitions take over.

## fetchState vs fetchState.callable vs asyncState

| | `fetchState` | `fetchState.callable` | `asyncState` |
|---|---|---|---|
| Trigger | reactive (signal change) | imperative (`.fetch(...)`) | reactive (signal change) |
| State shape | discriminated `FetchStateValue` | discriminated `FetchStateValue` | bare `T \| undefined` |
| Cancellation | built-in | built-in | manual |
| Body stringify | built-in | built-in | manual |
| HTTP status | exposed | exposed | n/a |
| Transport | pluggable adapter | pluggable adapter | direct `fetch` |
| Right for | GET, search, "fetch when key changes" | POST/PUT/DELETE, "fire on button click" | producers that do more than HTTP |

## See also

- [Async state](./async-state) — when the producer does more than fetch.
- [Reactive state](./reactive-state) — `effect`, `state`, the primitives this helper sits on top of.
