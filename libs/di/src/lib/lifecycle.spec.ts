import { describe, expect, it } from 'vitest';
import { onDestroy } from './lifecycle';

describe('onDestroy', () => {
  it('throws when called outside any construction scope', () => {
    expect(() => onDestroy(() => undefined)).toThrowError(
      /must be called during.*construction/
    );
  });
});
