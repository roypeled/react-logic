import { describe, it, expect, vi } from 'vitest';
import { batch, computedState, effect, endBatch, startBatch, state } from './state';

describe('state', () => {
  it('reads and writes a value', () => {
    const count = state(0);
    expect(count()).toBe(0);
    count(5);
    expect(count()).toBe(5);
  });

  it('holds independent values per instance', () => {
    const a = state('a');
    const b = state('b');
    a('A');
    expect(b()).toBe('b');
  });
});

describe('computedState', () => {
  it('derives from a state and updates when inputs change', () => {
    const count = state(2);
    const doubled = computedState(() => count() * 2);
    expect(doubled()).toBe(4);
    count(10);
    expect(doubled()).toBe(20);
  });

  it('composes with other computed values', () => {
    const count = state(1);
    const doubled = computedState(() => count() * 2);
    const plusOne = computedState(() => doubled() + 1);
    expect(plusOne()).toBe(3);
    count(4);
    expect(plusOne()).toBe(9);
  });

  it('only recomputes when its inputs actually change', () => {
    const count = state(1);
    const compute = vi.fn(() => count() * 2);
    const doubled = computedState(compute);

    doubled();
    doubled();
    doubled();
    expect(compute).toHaveBeenCalledTimes(1);

    count(2);
    doubled();
    expect(compute).toHaveBeenCalledTimes(2);
  });
});

describe('effect — cleanup callback', () => {
  it('runs the cleanup before each re-run', () => {
    const count = state(0);
    const ran: string[] = [];
    const stop = effect(() => {
      const c = count();
      ran.push(`run:${c}`);
      return () => ran.push(`cleanup:${c}`);
    });

    count(1);
    count(2);
    expect(ran).toEqual([
      'run:0',         // initial
      'cleanup:0',     // before re-run with new value
      'run:1',
      'cleanup:1',
      'run:2',
    ]);

    stop();
    expect(ran).toEqual([
      'run:0',
      'cleanup:0',
      'run:1',
      'cleanup:1',
      'run:2',
      'cleanup:2',     // final cleanup on stop
    ]);
  });

  it('does not require returning a cleanup', () => {
    const count = state(0);
    const stop = effect(() => {
      void count();
    });
    count(1);
    count(2);
    stop();
    // No throw, no cleanup tracked, just plain effect behavior.
  });

  it('catches errors thrown by cleanup so subsequent runs continue', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const count = state(0);
    const seen: number[] = [];
    const stop = effect(() => {
      seen.push(count());
      return () => {
        throw new Error('boom');
      };
    });

    count(1);
    count(2);
    expect(seen).toEqual([0, 1, 2]);
    expect(errSpy).toHaveBeenCalled();

    stop();
    errSpy.mockRestore();
  });

  it('stop is idempotent', () => {
    const cleanup = vi.fn();
    const stop = effect(() => cleanup);
    stop();
    stop();
    stop();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});

describe('computedState — input variant', () => {
  it('input defaults to undefined when no default-arg is declared', () => {
    const pattern = computedState((q: string | undefined) =>
      q ? new RegExp(q, 'i') : null
    );
    expect(pattern()).toBeNull();
    pattern('foo');
    expect(pattern()).toBeInstanceOf(RegExp);
    expect((pattern() as RegExp).source).toBe('foo');
  });

  it('default-arg syntax seeds the first read', () => {
    const upper = computedState((s = 'hi') => s.toUpperCase());
    expect(upper()).toBe('HI');
    upper('bye');
    expect(upper()).toBe('BYE');
  });

  it('triggers reactive effects when the input changes', () => {
    const doubled = computedState((n = 1) => n * 2);
    const seen: number[] = [];
    const stop = effect(() => {
      seen.push(doubled());
    });
    doubled(5);
    doubled(7);
    stop();
    expect(seen).toEqual([2, 10, 14]);
  });

  it('only recomputes when the input actually changes', () => {
    const fn = vi.fn((n = 1) => n * 2);
    const c = computedState(fn);
    c();
    c();
    c(2);
    c();
    c(2);
    c();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('plain 0-arg form still works', () => {
    const count = state(2);
    const c = computedState(() => count() * 3);
    expect(c()).toBe(6);
    count(4);
    expect(c()).toBe(12);
  });
});

describe('batch', () => {
  it('coalesces multiple writes into a single effect notification', () => {
    const a = state(1);
    const b = state(2);
    const seen: number[] = [];
    const stop = effect(() => {
      seen.push(a() + b());
    });

    // Without batch: two notifications.
    a(10);
    b(20);
    // With batch: one notification.
    batch(() => {
      a(100);
      b(200);
    });
    stop();

    // Initial run (1+2=3), then write to a (10+2=12), then write to b (10+20=30),
    // then the batched pair lands as a single notification (100+200=300).
    expect(seen).toEqual([3, 12, 30, 300]);
  });

  it('returns the callback value', () => {
    const out = batch(() => 42);
    expect(out).toBe(42);
  });

  it('closes the batch even if the callback throws', () => {
    const a = state(1);
    const seen: number[] = [];
    const stop = effect(() => {
      seen.push(a());
    });

    expect(() =>
      batch(() => {
        a(7);
        throw new Error('boom');
      })
    ).toThrow('boom');

    // After the throw, subsequent writes still notify normally — proves
    // endBatch ran in the finally.
    a(8);
    stop();
    expect(seen).toEqual([1, 7, 8]);
  });

  it('nests safely via the depth counter', () => {
    const a = state(0);
    const seen: number[] = [];
    const stop = effect(() => {
      seen.push(a());
    });

    batch(() => {
      a(1);
      batch(() => {
        a(2);
      });
      // Inner endBatch did not flush — depth still > 0.
      a(3);
    });
    stop();

    // Initial 0, then a single batched flush at 3 (last value).
    expect(seen).toEqual([0, 3]);
  });

  it('exposes the raw start/end pair for advanced cases', () => {
    const a = state(0);
    const seen: number[] = [];
    const stop = effect(() => {
      seen.push(a());
    });

    startBatch();
    a(5);
    a(6);
    a(7);
    endBatch();
    stop();

    expect(seen).toEqual([0, 7]);
  });
});
