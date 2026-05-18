import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CircularDependencyInjectionError,
  InjectionContextInstance,
  UnresolvedInjectionError,
} from './injection-context';
import { InjectionToken } from './injection-token';
import { onDestroy } from './lifecycle';

class Service {
  value = 'service';
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

describe('InjectionContextInstance.get', () => {
  it('resolves a value provider', () => {
    const TOKEN = new InjectionToken<string>('CONFIG');
    const ctx = new InjectionContextInstance(
      [{ provide: TOKEN, useValue: 'hello' }],
      'test'
    );
    expect(ctx.get(TOKEN)).toBe('hello');
  });

  it('resolves a class provider and caches the instance', () => {
    const ctx = new InjectionContextInstance(
      [{ provide: Service, useClass: Service }],
      'test'
    );
    const a = ctx.get(Service);
    const b = ctx.get(Service);
    expect(a).toBeInstanceOf(Service);
    expect(a).toBe(b);
  });

  it('resolves a factory provider exactly once', () => {
    const TOKEN = new InjectionToken<{ id: number }>('OBJ');
    const factory = vi.fn(() => ({ id: Math.random() }));
    const ctx = new InjectionContextInstance(
      [{ provide: TOKEN, useFactory: factory }],
      'test'
    );
    const a = ctx.get(TOKEN);
    const b = ctx.get(TOKEN);
    expect(a).toBe(b);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('auto-registers a class token when no provider exists', () => {
    const ctx = new InjectionContextInstance([], 'test');
    const inst = ctx.get(Service);
    expect(inst).toBeInstanceOf(Service);
  });

  it('throws UnresolvedInjectionError for an unregistered InjectionToken', () => {
    const TOKEN = new InjectionToken<string>('MISSING');
    const ctx = new InjectionContextInstance([], 'test');
    expect(() => ctx.get(TOKEN)).toThrow(UnresolvedInjectionError);
  });

  it('returns null for optional unregistered tokens', () => {
    const TOKEN = new InjectionToken<string>('MAYBE');
    const ctx = new InjectionContextInstance([], 'test');
    expect(ctx.get(TOKEN, true)).toBeNull();
  });

  it('detects circular dependencies during construction', () => {
    const ctx = new InjectionContextInstance([], 'test');
    class A {
      constructor() {
        ctx.get(B);
      }
    }
    class B {
      constructor() {
        ctx.get(A);
      }
    }
    expect(() => ctx.get(A)).toThrow(CircularDependencyInjectionError);
  });
});

describe('InjectionContextInstance.fromContext', () => {
  it('inherits providers from the parent context', () => {
    const TOKEN = new InjectionToken<string>('SHARED');
    const parent = new InjectionContextInstance(
      [{ provide: TOKEN, useValue: 'parent' }],
      'parent'
    );
    const child = InjectionContextInstance.fromContext(parent, []);
    expect(child.get(TOKEN)).toBe('parent');
  });

  it('child providers override inherited ones', () => {
    const TOKEN = new InjectionToken<string>('SHARED');
    const parent = new InjectionContextInstance(
      [{ provide: TOKEN, useValue: 'parent' }],
      'parent'
    );
    const child = InjectionContextInstance.fromContext(parent, [
      { provide: TOKEN, useValue: 'child' },
    ]);
    expect(child.get(TOKEN)).toBe('child');
  });

  it('shares the parent instance cache so singletons are honored across scopes', () => {
    const parent = new InjectionContextInstance(
      [{ provide: Service, useClass: Service }],
      'parent'
    );
    const fromParent = parent.get(Service);
    const child = InjectionContextInstance.fromContext(parent, []);
    expect(child.get(Service)).toBe(fromParent);
  });
});

describe('InjectionContextInstance.dispose', () => {
  it('runs onDestroy callbacks registered during service construction', () => {
    const cleanup = vi.fn();
    class Resourceful {
      constructor() {
        onDestroy(cleanup);
      }
    }
    const ctx = new InjectionContextInstance([], 'test');
    ctx.get(Resourceful);
    ctx.dispose();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('does not call onDestroy from a different service', () => {
    const aCleanup = vi.fn();
    const bCleanup = vi.fn();
    class A {
      constructor() {
        onDestroy(aCleanup);
      }
    }
    class B {
      constructor() {
        onDestroy(bCleanup);
      }
    }
    const ctx = new InjectionContextInstance([], 'test');
    ctx.get(A);
    ctx.get(B);
    ctx.dispose();
    expect(aCleanup).toHaveBeenCalledOnce();
    expect(bCleanup).toHaveBeenCalledOnce();
  });

  it('clears the instance cache so subsequent gets construct fresh', () => {
    const ctx = new InjectionContextInstance([], 'test');
    const before = ctx.get(Service);
    ctx.dispose();
    const after = ctx.get(Service);
    expect(after).toBeInstanceOf(Service);
    expect(after).not.toBe(before);
  });

  it('skips sink-tracking for value providers', () => {
    const TOKEN = new InjectionToken<{ x: number }>('OBJ');
    const ctx = new InjectionContextInstance(
      [{ provide: TOKEN, useValue: { x: 1 } }],
      'test'
    );
    const v = ctx.get(TOKEN);
    expect(() => ctx.dispose()).not.toThrow();
    expect(v).toEqual({ x: 1 });
  });
});
