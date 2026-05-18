import { describe, expect, it } from 'vitest';
import { InjectionToken } from './injection-token';

describe('InjectionToken', () => {
  it('uses a default description', () => {
    const token = new InjectionToken<string>();
    expect(token.toString()).toBe('Injection token: unnamed');
  });

  it('uses the provided description', () => {
    const token = new InjectionToken<string>('API_URL');
    expect(token.toString()).toBe('Injection token: API_URL');
  });

  it('produces unique identities for tokens with the same description', () => {
    const a = new InjectionToken<number>('thing');
    const b = new InjectionToken<number>('thing');
    expect(a).not.toBe(b);
  });
});
