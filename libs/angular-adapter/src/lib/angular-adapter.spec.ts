import '@angular/compiler';
import { describe, expect, it, vi } from 'vitest';
import {
  createEnvironmentInjector,
  EnvironmentInjector,
  Injectable,
  Injector,
} from '@angular/core';
import { InjectionToken, onDestroy, setDIAdapter } from '@react-logic/di';
import { createAngularAdapter } from './angular-adapter';

const buildAdapter = () => {
  const root = createEnvironmentInjector(
    [],
    Injector.NULL as unknown as EnvironmentInjector,
    'react-logic-root'
  );
  const adapter = createAngularAdapter(root);
  setDIAdapter(adapter);
  return { adapter, root };
};

describe('createAngularAdapter', () => {
  it('resolves a value provider through Angular DI', () => {
    const { adapter, root } = buildAdapter();
    const TOKEN = new InjectionToken<string>('CFG');
    const scope = adapter.createScope([{ provide: TOKEN, useValue: 'hi' }], root);
    expect(adapter.runIn(scope, () => adapter.inject(TOKEN))).toBe('hi');
    adapter.disposeScope(scope);
  });

  it('resolves a class provider and caches the instance', () => {
    const { adapter, root } = buildAdapter();
    @Injectable()
    class Service {}
    const scope = adapter.createScope(
      [{ provide: Service, useClass: Service }],
      root
    );
    const a = adapter.runIn(scope, () => adapter.inject(Service));
    const b = adapter.runIn(scope, () => adapter.inject(Service));
    expect(a).toBeInstanceOf(Service);
    expect(a).toBe(b);
    adapter.disposeScope(scope);
  });

  it('falls through to a parent scope', () => {
    const { adapter, root } = buildAdapter();
    const TOKEN = new InjectionToken<string>('FROM_PARENT');
    const parent = adapter.createScope([{ provide: TOKEN, useValue: 'parent' }], root);
    const child = adapter.createScope([], parent);
    expect(adapter.runIn(child, () => adapter.inject(TOKEN))).toBe('parent');
    adapter.disposeScope(child);
    adapter.disposeScope(parent);
  });

  it('child providers shadow parent providers', () => {
    const { adapter, root } = buildAdapter();
    const TOKEN = new InjectionToken<string>('LEVEL');
    const parent = adapter.createScope([{ provide: TOKEN, useValue: 'parent' }], root);
    const child = adapter.createScope([{ provide: TOKEN, useValue: 'child' }], parent);
    expect(adapter.runIn(child, () => adapter.inject(TOKEN))).toBe('child');
    adapter.disposeScope(child);
    adapter.disposeScope(parent);
  });

  it('disposeScope fires onDestroy registered during service construction', () => {
    const { adapter, root } = buildAdapter();
    const cleanup = vi.fn();
    @Injectable()
    class Service {
      constructor() {
        onDestroy(cleanup);
      }
    }
    const scope = adapter.createScope([{ provide: Service, useClass: Service }], root);
    adapter.runIn(scope, () => adapter.inject(Service));
    expect(cleanup).not.toHaveBeenCalled();
    adapter.disposeScope(scope);
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('construct disposes the logic-level destroy context without disposing services', () => {
    const { adapter, root } = buildAdapter();
    const serviceCleanup = vi.fn();
    const logicCleanup = vi.fn();

    @Injectable()
    class Service {
      constructor() {
        onDestroy(serviceCleanup);
      }
    }

    const scope = adapter.createScope([{ provide: Service, useClass: Service }], root);

    const built = adapter.construct(scope, () => {
      const svc = adapter.inject(Service);
      onDestroy(logicCleanup);
      return { svc };
    });

    expect(built.injected).toContain(built.result.svc);

    built.dispose();
    expect(logicCleanup).toHaveBeenCalledOnce();
    expect(serviceCleanup).not.toHaveBeenCalled();

    adapter.disposeScope(scope);
    expect(serviceCleanup).toHaveBeenCalledOnce();
  });

  it('returns null for an optional missing token', () => {
    const { adapter, root } = buildAdapter();
    const TOKEN = new InjectionToken<string>('MAYBE');
    const scope = adapter.createScope([], root);
    expect(adapter.runIn(scope, () => adapter.inject(TOKEN, true))).toBeNull();
    adapter.disposeScope(scope);
  });

  it('rootScope is the EnvironmentInjector passed in', () => {
    const { adapter, root } = buildAdapter();
    expect(adapter.rootScope).toBe(root);
  });
});
