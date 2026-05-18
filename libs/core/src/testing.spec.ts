import { describe, it, expect, vi, beforeEach } from 'vitest';
import { state } from '@react-logic/state';
import { asyncState } from '@react-logic/utils';
import { inject, InjectionToken, onDestroy } from '@react-logic/di';
import { createTestInjectionScope, flushAsyncSignals, flushAsyncSignalsUntil } from './testing';

beforeEach(() => {
  vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

describe('createTestInjectionScope', () => {
  it('builds a logic instance and runs its onDestroy on dispose', () => {
    const cleanup = vi.fn();
    class Logic {
      constructor() {
        onDestroy(cleanup);
      }
    }

    const t = createTestInjectionScope();
    t.build(Logic);
    expect(cleanup).not.toHaveBeenCalled();
    t.dispose();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('overrides services with useClass', () => {
    class Real {
      label = 'real';
    }
    class Fake {
      label = 'fake';
    }
    class Logic {
      svc = inject(Real);
    }

    const t = createTestInjectionScope([{ provide: Real, useClass: Fake }]);
    const logic = t.build(Logic);
    // Fake stands in for Real — same shape, different value.
    expect((logic.svc as unknown as Fake).label).toBe('fake');
    t.dispose();
  });

  it('accepts bare classes as provider shorthand', () => {
    class Service {
      label = state('service');
    }
    class Logic {
      svc = inject(Service);
    }

    const t = createTestInjectionScope([Service]);
    const logic = t.build(Logic);
    expect(logic.svc.label()).toBe('service');
    t.dispose();
  });

  it('overrides values via InjectionToken', () => {
    const TOKEN = new InjectionToken<string>('GREETING');
    class Logic {
      msg = inject(TOKEN);
    }

    const t = createTestInjectionScope([{ provide: TOKEN, useValue: 'hi' }]);
    const logic = t.build(Logic);
    expect(logic.msg).toBe('hi');
    t.dispose();
  });

  it('disposes injected services on scope teardown', () => {
    const cleanup = vi.fn();
    class Service {
      constructor() {
        onDestroy(cleanup);
      }
    }
    class Logic {
      svc = inject(Service);
    }

    const t = createTestInjectionScope([Service]);
    t.build(Logic);
    expect(cleanup).not.toHaveBeenCalled();
    t.dispose();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('mocks a service three layers deep without touching the layers above', async () => {
    // Production code — no awareness of the test or the mock.
    class HttpService {
      async fetch(url: string): Promise<{ json: () => Promise<unknown> }> {
        throw new Error(`real fetch should not run in tests, called ${url}`);
      }
    }

    class UserStore {
      http = inject(HttpService);
      user = state<{ id: string; name: string } | null>(null);
      async load(id: string) {
        const res = await this.http.fetch(`/users/${id}`);
        this.user((await res.json()) as { id: string; name: string });
      }
    }

    class ProfilePageLogic {
      store = inject(UserStore);
      open(id: string) {
        return this.store.load(id);
      }
    }

    // Test override at the leaf. UserStore needs to be listed too — without
    // it, UserStore auto-registers on the root scope and its `inject(HttpService)`
    // resolves through root, missing our override. Providing UserStore in the
    // test scope forces it to construct *here*, where it sees FakeHttp.
    const fetchMock = vi.fn(async (url: string) => ({
      json: async () => ({ id: url.split('/').pop()!, name: 'Test User' }),
    }));
    class FakeHttp {
      fetch = fetchMock;
    }

    const t = createTestInjectionScope([
      { provide: HttpService, useClass: FakeHttp },
      UserStore,
    ]);
    const logic = t.build(ProfilePageLogic);
    await logic.open('42');

    expect(logic.store.user()).toEqual({ id: '42', name: 'Test User' });
    expect(fetchMock).toHaveBeenCalledWith('/users/42');
    t.dispose();
  });

  it('built logic disposal does not affect services in the same scope', () => {
    const logicCleanup = vi.fn();
    const serviceCleanup = vi.fn();
    class Service {
      constructor() {
        onDestroy(serviceCleanup);
      }
    }
    class Logic {
      svc = inject(Service);
      constructor() {
        onDestroy(logicCleanup);
      }
    }

    const t = createTestInjectionScope([Service]);
    t.build(Logic);
    t.dispose();
    expect(logicCleanup).toHaveBeenCalledOnce();
    expect(serviceCleanup).toHaveBeenCalledOnce();
  });
});

describe('flushAsyncSignals', () => {
  it('lets an asyncState producer resolve', async () => {
    class Logic {
      data = asyncState(async () => 'hello');
    }
    const t = createTestInjectionScope();
    const logic = t.build(Logic);

    expect(logic.data()).toBeUndefined();
    await flushAsyncSignals();
    expect(logic.data()).toBe('hello');

    t.dispose();
  });

  it('handles asyncState that depends on signals', async () => {
    class Logic {
      key = state(1);
      doubled = asyncState(async () => this.key() * 2);
    }
    const t = createTestInjectionScope();
    const logic = t.build(Logic);

    await flushAsyncSignals();
    expect(logic.doubled()).toBe(2);

    logic.key(5);
    await flushAsyncSignals();
    expect(logic.doubled()).toBe(10);

    t.dispose();
  });
});

describe('flushAsyncSignalsUntil', () => {
  it('returns the value once the asyncState resolves', async () => {
    class Logic {
      data = asyncState(async () => 'hello');
    }
    const t = createTestInjectionScope();
    const logic = t.build(Logic);

    const value = await flushAsyncSignalsUntil(() => logic.data());
    expect(value).toBe('hello');
    t.dispose();
  });

  it('handles producers that await multiple steps', async () => {
    class Logic {
      data = asyncState(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        return { id: 42 };
      });
    }
    const t = createTestInjectionScope();
    const logic = t.build(Logic);

    const value = await flushAsyncSignalsUntil(() => logic.data());
    expect(value).toEqual({ id: 42 });
    t.dispose();
  });

  it('throws when the getter never produces a value', async () => {
    class Logic {
      data = state<string | undefined>(undefined);
    }
    const t = createTestInjectionScope();
    const logic = t.build(Logic);

    await expect(
      flushAsyncSignalsUntil(() => logic.data(), { maxFlushes: 5 })
    ).rejects.toThrowError(/undefined for 5 consecutive flushes/);

    t.dispose();
  });

  it('returns falsy values that are not undefined', async () => {
    class Logic {
      data = asyncState(async () => 0);
    }
    const t = createTestInjectionScope();
    const logic = t.build(Logic);

    const value = await flushAsyncSignalsUntil(() => logic.data());
    expect(value).toBe(0);
    t.dispose();
  });
});

describe('createTestInjectionScope — logging', () => {
  it('routes adapter logs to console.log by default', () => {
    vi.spyOn(console, 'log').mockRestore();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    class Service {}
    class Logic {
      svc = inject(Service);
    }
    const t = createTestInjectionScope([Service]);
    t.build(Logic);

    expect(
      logSpy.mock.calls.some(
        (args) => typeof args[0] === 'string' && args[0].includes('[react-logic]')
      )
    ).toBe(true);

    t.dispose();
    logSpy.mockRestore();
  });

  it('logs each inject with its caller (nested injects)', () => {
    vi.spyOn(console, 'log').mockRestore();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    class Inner {}
    class Outer {
      inner = inject(Inner);
    }
    class Logic {
      outer = inject(Outer);
    }

    const t = createTestInjectionScope([Inner, Outer]);
    t.build(Logic);

    const messages = logSpy.mock.calls
      .map((args) => args.slice(1).join(' '))
      .filter((m) => m.includes('Inject '));

    // Outer's inject by Logic happens first (no in-tree caller yet for the
    // top-level inject inside the build callback), then Inner's inject
    // happens during Outer's construction with Outer as the caller. Scope
    // identifier appears at the end of every inject line.
    expect(
      messages.some((m) => /^Inject Outer \[injector#\d+\]$/.test(m))
    ).toBe(true);
    expect(
      messages.some((m) => /^Inject Inner ← Outer \[injector#\d+\]$/.test(m))
    ).toBe(true);

    t.dispose();
    logSpy.mockRestore();
  });

  it('disambiguates two scopes that hold the same service', () => {
    vi.spyOn(console, 'log').mockRestore();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    class Service {}
    class Logic {
      svc = inject(Service);
    }

    const a = createTestInjectionScope([Service]);
    const b = createTestInjectionScope([Service]);
    a.build(Logic);
    b.build(Logic);

    const messages = logSpy.mock.calls
      .map((args) => args.slice(1).join(' '))
      .filter((m) => m.includes('Inject Service'));

    const scopeIds = messages
      .map((m) => m.match(/\[injector#(\d+)\]/)?.[1])
      .filter((id): id is string => Boolean(id));

    // The two scopes get distinct ids — log lines are not ambiguous.
    expect(new Set(scopeIds).size).toBeGreaterThanOrEqual(2);

    a.dispose();
    b.dispose();
    logSpy.mockRestore();
  });
});
