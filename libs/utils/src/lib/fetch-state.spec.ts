import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effect } from '@react-logic/state';
import {
  deleteFetchState,
  fetchState,
  postFetchState,
  putFetchState,
  type FetchStateValue,
} from './fetch-state';
import {
  createAxiosFetchAdapter,
  defaultFetchAdapter,
  setFetchStateAdapter,
} from './fetch-adapter';

interface MockFetchCall {
  url: string;
  signal: AbortSignal;
  init: RequestInit;
  resolve: (data: unknown, status?: number) => void;
  reject: (err: Error) => void;
}

const installFetchMock = () => {
  const calls: MockFetchCall[] = [];
  const fakeFetch = vi.fn((url: string, init?: RequestInit) => {
    let resolveFn!: (data: unknown, status?: number) => void;
    let rejectFn!: (err: Error) => void;
    const p = new Promise<Response>((resolve, reject) => {
      resolveFn = (data, status = 200) => {
        resolve({
          ok: status >= 200 && status < 300,
          status,
          json: async () => data,
          text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
        } as Response);
      };
      rejectFn = reject;
    });
    const signal = init?.signal as AbortSignal;
    if (signal) {
      signal.addEventListener('abort', () => {
        const err = new Error('aborted') as Error & { name: string };
        err.name = 'AbortError';
        rejectFn(err);
      });
    }
    calls.push({ url, signal, init: init ?? {}, resolve: resolveFn, reject: rejectFn });
    return p;
  });
  vi.stubGlobal('fetch', fakeFetch);
  return { calls, fakeFetch };
};

describe('fetchState — reactive — state machine', () => {
  let env!: ReturnType<typeof installFetchMock>;
  beforeEach(() => { env = installFetchMock(); });
  afterEach(() => {
    vi.unstubAllGlobals();
    setFetchStateAdapter(defaultFetchAdapter);
  });

  it('starts in the loading state', () => {
    const data = fetchState(() => '/api');
    const s = data();
    expect(s.loading).toBe(true);
    expect(s.failed).toBe(false);
  });

  it('transitions to success with status on resolve', async () => {
    const data = fetchState(() => '/api');
    env.calls[0].resolve({ hello: 'world' }, 200);
    await new Promise((r) => setTimeout(r, 0));

    expect(data()).toEqual({
      idle: false,
      loading: false,
      failed: false,
      status: 200,
      result: { hello: 'world' },
    });
  });

  it('transitions to failed with HTTP status on non-2xx (default parse throws)', async () => {
    const data = fetchState(() => '/api');
    env.calls[0].resolve({ error: 'gone' }, 404);
    await new Promise((r) => setTimeout(r, 0));

    const s = data();
    expect(s.failed).toBe(true);
    if (s.failed) {
      expect(s.status).toBe(404);
      expect(s.error.message).toBe('HTTP 404');
    }
  });

  it('transitions to failed without status on network errors', async () => {
    const data = fetchState(() => '/api');
    env.calls[0].reject(new TypeError('Failed to fetch'));
    await new Promise((r) => setTimeout(r, 0));

    const s = data();
    expect(s.failed).toBe(true);
    if (s.failed) {
      expect(s.status).toBeUndefined();
      expect(s.error.message).toBe('Failed to fetch');
    }
  });
});

describe('fetchState — reactive — .fetch surface', () => {
  let env!: ReturnType<typeof installFetchMock>;
  beforeEach(() => { env = installFetchMock(); });
  afterEach(() => {
    vi.unstubAllGlobals();
    setFetchStateAdapter(defaultFetchAdapter);
  });

  it('.fetch(value) writes the input, re-enters loading, then resolves', async () => {
    const search = fetchState((q = '') => `/api?q=${q}`);
    env.calls[0].resolve(['a'], 200);
    await new Promise((r) => setTimeout(r, 0));
    expect(search().loading).toBe(false);

    search.fetch('next');
    expect(search().loading).toBe(true);
    expect(env.calls.length).toBe(2);
    expect(env.calls[1].url).toBe('/api?q=next');

    env.calls[1].resolve(['b'], 200);
    await new Promise((r) => setTimeout(r, 0));
    expect(search()).toEqual({
      idle: false,
      loading: false,
      failed: false,
      status: 200,
      result: ['b'],
    });
  });

  it('.fetch() with no args refetches with the current input', async () => {
    const search = fetchState((q = 'init') => `/api?q=${q}`);
    env.calls[0].resolve({ v: 1 }, 200);
    await new Promise((r) => setTimeout(r, 0));

    search.fetch();
    expect(env.calls.length).toBe(2);
    expect(env.calls[1].url).toBe('/api?q=init');
    expect(search().loading).toBe(true);
  });

  it('.fetch() refetches the same URL for 0-param reactive fetchState', async () => {
    const data = fetchState(() => '/api');
    env.calls[0].resolve({ v: 1 }, 200);
    await new Promise((r) => setTimeout(r, 0));
    expect((data() as { result: { v: number } }).result.v).toBe(1);

    data.fetch();
    expect(env.calls.length).toBe(2);
    env.calls[1].resolve({ v: 2 }, 200);
    await new Promise((r) => setTimeout(r, 0));
    expect((data() as { result: { v: number } }).result.v).toBe(2);
  });

  it('.fetch(value) aborts the previous in-flight request', () => {
    const search = fetchState((q = '') => `/api?q=${q}`);
    expect(env.calls[0].signal.aborted).toBe(false);
    search.fetch('next');
    expect(env.calls[0].signal.aborted).toBe(true);
    expect(env.calls[1].signal.aborted).toBe(false);
  });

  it('ignores the resolve of an aborted request', async () => {
    const search = fetchState((q = '') => `/api?q=${q}`);
    search.fetch('second');
    env.calls[0].resolve('STALE', 200);
    await new Promise((r) => setTimeout(r, 0));
    expect(search().loading).toBe(true);

    env.calls[1].resolve('FRESH', 200);
    await new Promise((r) => setTimeout(r, 0));
    expect(search()).toEqual({
      idle: false,
      loading: false,
      failed: false,
      status: 200,
      result: 'FRESH',
    });
  });
});

describe('fetchState — body auto-stringify', () => {
  let env!: ReturnType<typeof installFetchMock>;
  beforeEach(() => { env = installFetchMock(); });
  afterEach(() => {
    vi.unstubAllGlobals();
    setFetchStateAdapter(defaultFetchAdapter);
  });

  it('stringifies a plain-object body and sets Content-Type', () => {
    fetchState(() => '/api', { method: 'POST', body: { a: 1, b: 'two' } });
    expect(env.calls[0].init.body).toBe('{"a":1,"b":"two"}');
    expect(env.calls[0].init.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('stringifies an array body', () => {
    fetchState(() => '/api', { method: 'POST', body: [1, 2, 3] });
    expect(env.calls[0].init.body).toBe('[1,2,3]');
  });

  it('does not override an existing Content-Type', () => {
    fetchState(() => '/api', {
      method: 'POST',
      body: { a: 1 },
      headers: { 'Content-Type': 'application/vnd.api+json' },
    });
    expect(env.calls[0].init.headers).toEqual({
      'Content-Type': 'application/vnd.api+json',
    });
  });

  it('passes string bodies through untouched', () => {
    fetchState(() => '/api', { method: 'POST', body: 'raw text' });
    expect(env.calls[0].init.body).toBe('raw text');
    expect(env.calls[0].init.headers).toBeUndefined();
  });

  it('passes FormData bodies through untouched', () => {
    const fd = new FormData();
    fd.append('field', 'value');
    fetchState(() => '/api', { method: 'POST', body: fd });
    expect(env.calls[0].init.body).toBe(fd);
  });
});

describe('build-callback union (string | request descriptor)', () => {
  let env!: ReturnType<typeof installFetchMock>;
  beforeEach(() => { env = installFetchMock(); });
  afterEach(() => {
    vi.unstubAllGlobals();
    setFetchStateAdapter(defaultFetchAdapter);
  });

  it('fetchState callback can return a config object instead of a URL string', () => {
    fetchState(() => ({
      url: '/api',
      method: 'PATCH',
      body: { touched: 1 },
    }));
    expect(env.calls[0].url).toBe('/api');
    expect(env.calls[0].init.method).toBe('PATCH');
    expect(env.calls[0].init.body).toBe('{"touched":1}');
  });

  it('fetchState.callable can return a URL string', () => {
    const get = fetchState.callable((id: string) => `/items/${id}`);
    get.fetch('42');
    expect(env.calls.length).toBe(1);
    expect(env.calls[0].url).toBe('/items/42');
    expect(env.calls[0].init.method).toBeUndefined();
  });

  it('per-call descriptor overrides defaults; headers deep-merge', () => {
    fetchState.callable(
      (msg: string) => ({
        url: '/api/comments',
        method: 'POST',
        body: { msg },
        headers: { 'X-Trace': 'a' },
      }),
      { headers: { Authorization: 'Bearer t', 'X-Trace': 'will-be-overridden' } }
    ).fetch('hello');

    expect(env.calls[0].init.method).toBe('POST');
    expect(env.calls[0].init.headers).toEqual({
      Authorization: 'Bearer t',
      'X-Trace': 'a',
      'Content-Type': 'application/json',
    });
  });

  it('fetchState merges defaults from the second config arg into every request', () => {
    fetchState(() => '/api', {
      headers: { Authorization: 'Bearer t' },
      method: 'GET',
    });
    expect(env.calls[0].init.headers).toEqual({ Authorization: 'Bearer t' });
    expect(env.calls[0].init.method).toBe('GET');
  });
});

describe('fetchState — adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setFetchStateAdapter(defaultFetchAdapter);
  });

  it('uses a per-call fetcher when supplied', async () => {
    const customFetcher = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ from: 'custom' }),
      text: async () => 'text',
    }));
    const env = installFetchMock();
    const data = fetchState(() => '/api', { fetcher: customFetcher });
    await new Promise((r) => setTimeout(r, 0));
    expect(customFetcher).toHaveBeenCalledOnce();
    expect(env.calls.length).toBe(0);
    expect(data()).toEqual({
      idle: false,
      loading: false,
      failed: false,
      status: 201,
      result: { from: 'custom' },
    });
  });

  it('respects setFetchStateAdapter globally', async () => {
    const globalFetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => 'global',
      text: async () => 'global',
    }));
    setFetchStateAdapter(globalFetcher);
    const env = installFetchMock();
    const data = fetchState(() => '/api');
    await new Promise((r) => setTimeout(r, 0));
    expect(globalFetcher).toHaveBeenCalledOnce();
    expect(env.calls.length).toBe(0);
    expect((data() as { result: unknown }).result).toBe('global');
  });

  it('axios adapter normalises a non-2xx response without throwing', async () => {
    const fakeAxios = {
      request: vi.fn(async () => ({ status: 500, data: 'server boom' })),
    };
    const adapter = createAxiosFetchAdapter(fakeAxios);
    const res = await adapter('/api', { signal: new AbortController().signal });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
    expect(await res.text()).toBe('server boom');
  });

  it('axios adapter parses JSON lazily', async () => {
    const fakeAxios = {
      request: vi.fn(async () => ({ status: 200, data: '{"name":"alice"}' })),
    };
    const adapter = createAxiosFetchAdapter(fakeAxios);
    const res = await adapter('/api', { signal: new AbortController().signal });
    expect(await res.json()).toEqual({ name: 'alice' });
  });
});

describe('fetchState — reactive integration', () => {
  let env!: ReturnType<typeof installFetchMock>;
  beforeEach(() => { env = installFetchMock(); });
  afterEach(() => {
    vi.unstubAllGlobals();
    setFetchStateAdapter(defaultFetchAdapter);
  });

  it('drives reactive effects on each state transition', async () => {
    const data = fetchState(() => '/api');
    const seen: FetchStateValue<unknown>[] = [];
    const stop = effect(() => { seen.push(data()); });
    env.calls[0].resolve(42, 200);
    await new Promise((r) => setTimeout(r, 0));
    stop();
    expect(seen[0]).toEqual({ idle: false, loading: true, failed: false });
    expect(seen.at(-1)).toEqual({
      idle: false,
      loading: false,
      failed: false,
      status: 200,
      result: 42,
    });
  });
});

describe('verb-preset helpers', () => {
  let env!: ReturnType<typeof installFetchMock>;
  beforeEach(() => { env = installFetchMock(); });
  afterEach(() => {
    vi.unstubAllGlobals();
    setFetchStateAdapter(defaultFetchAdapter);
  });

  it('fetchState defaults the method to GET when nothing is specified', () => {
    fetchState(() => '/api');
    expect(env.calls[0].init.method).toBe('GET');
  });

  it('postFetchState reactive sets method: POST', () => {
    postFetchState(() => '/api');
    expect(env.calls[0].init.method).toBe('POST');
  });

  it('postFetchState.callable also sets method: POST', () => {
    const submit = postFetchState.callable((msg: string) => ({
      url: '/api/comments',
      body: { msg },
    }));
    submit.fetch('hello');
    expect(env.calls[0].init.method).toBe('POST');
    expect(env.calls[0].init.body).toBe('{"msg":"hello"}');
  });

  it('postFetchState.callable: GraphQL-style reactive read via POST', async () => {
    const profile = postFetchState((id = 'u0') => ({
      url: '/graphql',
      body: { query: 'profile', variables: { id } },
    }));

    expect(env.calls[0].init.method).toBe('POST');
    expect(env.calls[0].init.body).toBe(
      '{"query":"profile","variables":{"id":"u0"}}'
    );

    // Reactive: writing the input fires a new POST.
    profile.fetch('u1');
    expect(env.calls.length).toBe(2);
    expect(env.calls[1].init.body).toBe(
      '{"query":"profile","variables":{"id":"u1"}}'
    );
  });

  it('putFetchState reactive sets method: PUT', () => {
    putFetchState(() => '/api');
    expect(env.calls[0].init.method).toBe('PUT');
  });

  it('putFetchState.callable sets method: PUT', () => {
    putFetchState.callable((id: string) => ({
      url: `/items/${id}`,
      body: { v: 1 },
    })).fetch('42');
    expect(env.calls[0].init.method).toBe('PUT');
  });

  it('deleteFetchState reactive sets method: DELETE', () => {
    deleteFetchState(() => '/api');
    expect(env.calls[0].init.method).toBe('DELETE');
  });

  it('deleteFetchState.callable sets method: DELETE', () => {
    deleteFetchState.callable((id: string) => `/items/${id}`).fetch('42');
    expect(env.calls[0].init.method).toBe('DELETE');
  });

  it("a per-call descriptor's method overrides the preset", () => {
    postFetchState.callable((id: string) => ({
      url: `/items/${id}`,
      method: 'PATCH',
      body: { v: 1 },
    })).fetch('42');
    expect(env.calls[0].init.method).toBe('PATCH');
  });

  it("the user's config method overrides the GET floor on fetchState", () => {
    fetchState(() => '/api', { method: 'HEAD' });
    expect(env.calls[0].init.method).toBe('HEAD');
  });

  it('verb helpers merge other config defaults like fetchState does', () => {
    const submit = postFetchState.callable(
      (msg: string) => ({ url: '/api', body: { msg } }),
      { headers: { Authorization: 'Bearer t' } }
    );
    submit.fetch('hello');
    expect(env.calls[0].init.method).toBe('POST');
    expect(env.calls[0].init.headers).toEqual({
      Authorization: 'Bearer t',
      'Content-Type': 'application/json',
    });
  });
});

describe('fetchState.callable', () => {
  let env!: ReturnType<typeof installFetchMock>;
  beforeEach(() => { env = installFetchMock(); });
  afterEach(() => {
    vi.unstubAllGlobals();
    setFetchStateAdapter(defaultFetchAdapter);
  });

  it('does not fire until .fetch(...) is invoked', () => {
    fetchState.callable((msg: string) => ({
      url: '/comments',
      method: 'POST',
      body: { msg },
    }));
    expect(env.calls.length).toBe(0);
  });

  it('starts in the idle state — not loading', () => {
    const post = fetchState.callable((msg: string) => ({
      url: '/comments',
      body: { msg },
    }));
    expect(post()).toEqual({ idle: true, loading: false, failed: false });
  });

  it('transitions idle → loading on the first .fetch(...)', () => {
    const post = fetchState.callable((msg: string) => ({
      url: '/comments',
      body: { msg },
    }));
    expect(post().idle).toBe(true);
    post.fetch('hello');
    const s = post();
    expect(s.idle).toBe(false);
    expect(s.loading).toBe(true);
  });

  it('reactive fetchState skips idle — starts in loading', () => {
    const data = fetchState(() => '/api');
    const s = data();
    expect(s.idle).toBe(false);
    expect(s.loading).toBe(true);
  });

  it('.fetch(...args) fires the request and lands in success', async () => {
    const post = fetchState.callable((msg: string) => ({
      url: '/comments',
      method: 'POST',
      body: { msg },
    }));
    post.fetch('hello');
    expect(env.calls.length).toBe(1);
    expect(env.calls[0].url).toBe('/comments');
    expect(env.calls[0].init.body).toBe('{"msg":"hello"}');
    expect(env.calls[0].init.method).toBe('POST');

    env.calls[0].resolve({ ok: true }, 201);
    await new Promise((r) => setTimeout(r, 0));
    expect(post()).toEqual({
      idle: false,
      loading: false,
      failed: false,
      status: 201,
      result: { ok: true },
    });
  });

  it('a second .fetch(...args) aborts the previous in-flight request', async () => {
    const post = fetchState.callable((msg: string) => ({
      url: '/comments',
      method: 'POST',
      body: { msg },
    }));
    post.fetch('first');
    expect(env.calls[0].signal.aborted).toBe(false);

    post.fetch('second');
    expect(env.calls[0].signal.aborted).toBe(true);
    expect(env.calls[1].init.body).toBe('{"msg":"second"}');

    env.calls[0].resolve({ stale: true }, 200);
    env.calls[1].resolve({ fresh: true }, 200);
    await new Promise((r) => setTimeout(r, 0));
    expect((post() as { result: { fresh: boolean } }).result).toEqual({ fresh: true });
  });

  it('.fetch() with no args re-runs the most recent args', async () => {
    const post = fetchState.callable((msg: string) => ({
      url: '/comments',
      method: 'POST',
      body: { msg },
    }));
    post.fetch('first');
    env.calls[0].resolve({ ok: 1 }, 201);
    await new Promise((r) => setTimeout(r, 0));

    post.fetch();
    expect(env.calls.length).toBe(2);
    expect(env.calls[1].init.body).toBe('{"msg":"first"}');
  });

  it('.fetch() is a no-op before any .fetch(...args)', () => {
    const post = fetchState.callable((msg: string) => ({
      url: '/comments',
      body: { msg },
    }));
    post.fetch();
    expect(env.calls.length).toBe(0);
  });

  it('reading with () returns the current state, never fires', () => {
    const post = fetchState.callable((msg: string) => ({
      url: '/comments',
      body: { msg },
    }));
    post();
    post();
    expect(env.calls.length).toBe(0);
  });

  it('propagates failure with status when the response is non-2xx', async () => {
    const post = fetchState.callable((msg: string) => ({
      url: '/comments',
      body: { msg },
    }));
    post.fetch('boom');
    env.calls[0].resolve({ error: 'bad request' }, 400);
    await new Promise((r) => setTimeout(r, 0));

    const s = post();
    expect(s.failed).toBe(true);
    if (s.failed) {
      expect(s.status).toBe(400);
      expect(s.error.message).toBe('HTTP 400');
    }
  });
});
