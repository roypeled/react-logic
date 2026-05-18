import { describe, it, expect, vi } from 'vitest';
import { asyncState, computedState, effect, state } from './state';

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

describe('asyncState', () => {
  it('starts as undefined and resolves to the awaited value', async () => {
    const value = asyncState(async () => {
      return 42;
    });

    expect(value()).toBeUndefined();
    await new Promise((r) => setTimeout(r, 0));
    expect(value()).toBe(42);
  });

  it('triggers reactive effects when it resolves', async () => {
    const value = asyncState(async () => 'hello');
    const seen: (string | undefined)[] = [];
    const stop = effect(() => {
      seen.push(value());
    });

    await new Promise((r) => setTimeout(r, 0));
    stop();

    expect(seen[0]).toBeUndefined();
    expect(seen.at(-1)).toBe('hello');
  });
});
