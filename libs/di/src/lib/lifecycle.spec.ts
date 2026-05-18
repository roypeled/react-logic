import { describe, expect, it, vi } from 'vitest';
import {
  onDestroy,
  popDestroySink,
  pushDestroySink,
  runDestroySink,
} from './lifecycle';

describe('onDestroy', () => {
  it('throws when called outside a construction scope', () => {
    expect(() => onDestroy(() => undefined)).toThrowError(
      /must be called during.*construction/
    );
  });

  it('registers callbacks into the topmost sink', () => {
    const sink = pushDestroySink();
    const cb = vi.fn();
    onDestroy(cb);
    popDestroySink();

    expect(sink).toHaveLength(1);
    runDestroySink(sink);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('routes to the innermost sink when scopes nest', () => {
    const outer = pushDestroySink();
    const outerCb = vi.fn();
    onDestroy(outerCb);

    const inner = pushDestroySink();
    const innerCb = vi.fn();
    onDestroy(innerCb);
    popDestroySink();

    const outerCb2 = vi.fn();
    onDestroy(outerCb2);
    popDestroySink();

    expect(inner).toHaveLength(1);
    expect(outer).toHaveLength(2);

    runDestroySink(inner);
    runDestroySink(outer);
    expect(innerCb).toHaveBeenCalledOnce();
    expect(outerCb).toHaveBeenCalledOnce();
    expect(outerCb2).toHaveBeenCalledOnce();
  });
});

describe('runDestroySink', () => {
  it('runs callbacks in reverse registration order (LIFO)', () => {
    const sink = pushDestroySink();
    const order: number[] = [];
    onDestroy(() => order.push(1));
    onDestroy(() => order.push(2));
    onDestroy(() => order.push(3));
    popDestroySink();

    runDestroySink(sink);
    expect(order).toEqual([3, 2, 1]);
  });

  it('isolates failures so one bad callback does not block others', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const sink = pushDestroySink();
    const a = vi.fn();
    const b = vi.fn();
    onDestroy(a);
    onDestroy(() => {
      throw new Error('boom');
    });
    onDestroy(b);
    popDestroySink();

    runDestroySink(sink);
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('clears the sink after running so it cannot fire twice', () => {
    const sink = pushDestroySink();
    const cb = vi.fn();
    onDestroy(cb);
    popDestroySink();

    runDestroySink(sink);
    runDestroySink(sink);
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
