import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inject } from './inject';
import {
  InjectionContextInstance,
  setInjectionLifecycleContext,
  UnresolvedInjectionError,
} from './injection-context';
import { InjectionToken } from './injection-token';

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

describe('inject', () => {
  it('resolves through the active lifecycle context', () => {
    class Service {}
    const ctx = new InjectionContextInstance(
      [{ provide: Service, useClass: Service }],
      'test'
    );
    const stop = setInjectionLifecycleContext(ctx);
    try {
      const got = inject(Service);
      expect(got).toBeInstanceOf(Service);
    } finally {
      stop();
    }
  });

  it('returns null when the optional flag is set and the token is missing', () => {
    const TOKEN = new InjectionToken<string>('OPTIONAL');
    const ctx = new InjectionContextInstance([], 'test');
    const stop = setInjectionLifecycleContext(ctx);
    try {
      expect(inject(TOKEN, { optional: true })).toBeNull();
    } finally {
      stop();
    }
  });

  it('throws when a non-optional token is missing', () => {
    const TOKEN = new InjectionToken<string>('REQUIRED');
    const ctx = new InjectionContextInstance([], 'test');
    const stop = setInjectionLifecycleContext(ctx);
    try {
      expect(() => inject(TOKEN)).toThrow(UnresolvedInjectionError);
    } finally {
      stop();
    }
  });

  it('falls back to the global context when no lifecycle context is active', () => {
    // Without setInjectionLifecycleContext, inject() uses the module-level
    // global context, which auto-registers classes on demand.
    class Standalone {}
    const got = inject(Standalone);
    expect(got).toBeInstanceOf(Standalone);
  });
});
