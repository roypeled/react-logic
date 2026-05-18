import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultAdapter, CircularDependencyInjectionError, UnresolvedInjectionError } from './default-adapter';
import { InjectionToken } from './injection-token';
import { onDestroy } from './lifecycle';
import { inject } from './inject';

beforeEach(() => {
  vi.spyOn(console, 'debug').mockImplementation(() => undefined);
});

const a = defaultAdapter;

describe('defaultAdapter — scope resolution', () => {
  it('resolves a value provider in a scope', () => {
    const TOKEN = new InjectionToken<string>('CONFIG');
    const scope = a.createScope([{ provide: TOKEN, useValue: 'hi' }], a.rootScope);
    expect(a.runIn(scope, () => a.inject(TOKEN))).toBe('hi');
  });

  it('resolves a class provider and caches the instance', () => {
    class Service {}
    const scope = a.createScope([{ provide: Service, useClass: Service }], a.rootScope);
    const x = a.runIn(scope, () => a.inject(Service))!;
    const y = a.runIn(scope, () => a.inject(Service))!;
    expect(x).toBeInstanceOf(Service);
    expect(x).toBe(y);
  });

  it('runs a factory provider exactly once', () => {
    const TOKEN = new InjectionToken<{ id: number }>('OBJ');
    const factory = vi.fn(() => ({ id: 42 }));
    const scope = a.createScope([{ provide: TOKEN, useFactory: factory }], a.rootScope);
    a.runIn(scope, () => a.inject(TOKEN));
    a.runIn(scope, () => a.inject(TOKEN));
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('falls through to a parent scope', () => {
    const TOKEN = new InjectionToken<string>('FROM_PARENT');
    const parent = a.createScope([{ provide: TOKEN, useValue: 'parent' }], a.rootScope);
    const child = a.createScope([], parent);
    expect(a.runIn(child, () => a.inject(TOKEN))).toBe('parent');
  });

  it('child providers shadow parent providers', () => {
    const TOKEN = new InjectionToken<string>('LEVEL');
    const parent = a.createScope([{ provide: TOKEN, useValue: 'parent' }], a.rootScope);
    const child = a.createScope([{ provide: TOKEN, useValue: 'child' }], parent);
    expect(a.runIn(child, () => a.inject(TOKEN))).toBe('child');
  });

  it('throws UnresolvedInjectionError for an unregistered InjectionToken', () => {
    const TOKEN = new InjectionToken<string>('MISSING');
    const scope = a.createScope([], a.rootScope);
    expect(() => a.runIn(scope, () => a.inject(TOKEN))).toThrow(UnresolvedInjectionError);
  });

  it('returns null for an optional unregistered token', () => {
    const TOKEN = new InjectionToken<string>('MAYBE');
    const scope = a.createScope([], a.rootScope);
    expect(a.runIn(scope, () => a.inject(TOKEN, true))).toBeNull();
  });

  it('detects circular dependencies during construction', () => {
    const scope = a.createScope([], a.rootScope);
    class A {
      constructor() {
        a.inject(B);
      }
    }
    class B {
      constructor() {
        a.inject(A);
      }
    }
    expect(() => a.runIn(scope, () => a.inject(A))).toThrow(CircularDependencyInjectionError);
  });
});

describe('defaultAdapter — disposeScope', () => {
  it('runs onDestroy callbacks of locally-constructed services', () => {
    const cleanup = vi.fn();
    class Resourceful {
      constructor() {
        onDestroy(cleanup);
      }
    }
    const scope = a.createScope(
      [{ provide: Resourceful, useClass: Resourceful }],
      a.rootScope
    );
    a.runIn(scope, () => a.inject(Resourceful));
    a.disposeScope(scope);
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('does not affect parent-cached instances', () => {
    const parentCleanup = vi.fn();
    const childCleanup = vi.fn();
    class P {
      constructor() {
        onDestroy(parentCleanup);
      }
    }
    class C {
      constructor() {
        onDestroy(childCleanup);
      }
    }
    const parent = a.createScope([{ provide: P, useClass: P }], a.rootScope);
    const child = a.createScope([{ provide: C, useClass: C }], parent);
    a.runIn(child, () => {
      a.inject(P);
      a.inject(C);
    });
    a.disposeScope(child);
    expect(childCleanup).toHaveBeenCalledOnce();
    expect(parentCleanup).not.toHaveBeenCalled();
    a.disposeScope(parent);
    expect(parentCleanup).toHaveBeenCalledOnce();
  });
});

describe('defaultAdapter — construct', () => {
  it('captures user onDestroy and reports injected services', () => {
    const tearDown = vi.fn();
    class Service {}
    class Logic {
      svc = inject(Service);
      constructor() {
        onDestroy(tearDown);
      }
    }
    const scope = a.createScope([{ provide: Service, useClass: Service }], a.rootScope);
    const built = a.construct(scope, () => new Logic());

    expect(built.result).toBeInstanceOf(Logic);
    expect(built.injected).toHaveLength(1);
    expect(built.injected[0]).toBeInstanceOf(Service);

    expect(tearDown).not.toHaveBeenCalled();
    built.dispose();
    expect(tearDown).toHaveBeenCalledOnce();
  });

  it('does not dispose injected services when the logic dispose runs', () => {
    const serviceCleanup = vi.fn();
    class Service {
      constructor() {
        onDestroy(serviceCleanup);
      }
    }
    class Logic {
      svc = inject(Service);
    }
    const scope = a.createScope([{ provide: Service, useClass: Service }], a.rootScope);
    const built = a.construct(scope, () => new Logic());
    built.dispose();
    expect(serviceCleanup).not.toHaveBeenCalled();
    a.disposeScope(scope);
    expect(serviceCleanup).toHaveBeenCalledOnce();
  });
});
