import { describe, it, expect } from 'vitest';
import { effect } from '@react-logic/state';
import { asyncState } from './async-state';

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
