import { describe, expect, it, vi } from 'vitest';
import { effect } from '@react-logic/state';
import {
  formGroup,
  formState,
  type FormErrors,
  type FormTouched,
  type FormValues,
} from './forms';
import {
  custom,
  email,
  integer,
  max,
  maxLength,
  min,
  minLength,
  oneOf,
  pattern,
  required,
  url,
} from './forms-validators';

describe('formState — flat fields', () => {
  it('builds a single-signal handle: form() returns the snapshot', () => {
    const form = formState({ name: {}, email: {} });
    const snap = form();
    expect(snap.values).toEqual({ name: '', email: '' });
    expect(snap.valid).toBe(true);
    expect(snap.pristine).toBe(true);
    expect(snap.submitting).toBe(false);
  });

  it('initial defaults to "" for text fields and false for checkboxes', () => {
    const form = formState({
      name: {},
      agree: { kind: 'checkbox' as const },
    });
    expect(form().values).toEqual({ name: '', agree: false });
  });

  it('uses explicit initial when provided', () => {
    const form = formState({
      name: { initial: 'alice' },
      score: { initial: 42, parse: Number },
    });
    expect(form().values).toEqual({ name: 'alice', score: 42 });
  });

  it('setValue writes the raw value and the snapshot reflects it', () => {
    const form = formState({ name: {} });
    form.setValue('name', 'bob');
    expect(form().values.name).toBe('bob');
  });

  it('parse runs on the raw input on update', () => {
    const form = formState({ age: { initial: 18, parse: Number } });
    form.setValue('age', '25');
    expect(form().values.age).toBe(25);
  });

  it('reset restores initial values and clears touched/submitted', () => {
    const form = formState({ name: { initial: 'alice' } });
    form.setValue('name', 'bob');
    form.reset();
    expect(form().values.name).toBe('alice');
    expect(form().touched).toEqual({ name: false });
  });
});

describe('formState — nested groups', () => {
  it('formGroup nests one level', () => {
    const form = formState({
      name: {},
      address: formGroup({
        city: {},
        zip: { initial: '00000' },
      }),
    });
    expect(form().values).toEqual({
      name: '',
      address: { city: '', zip: '00000' },
    });
  });

  it('nests recursively', () => {
    const form = formState({
      contact: formGroup({
        primary: formGroup({ email: {}, phone: {} }),
        secondary: formGroup({ email: {}, phone: {} }),
      }),
    });
    expect(form().values).toEqual({
      contact: {
        primary: { email: '', phone: '' },
        secondary: { email: '', phone: '' },
      },
    });
  });

  it('setValue accepts dot-paths into groups', () => {
    const form = formState({
      address: formGroup({ city: {}, zip: {} }),
    });
    form.setValue('address.city', 'Tel Aviv');
    expect(form().values.address.city).toBe('Tel Aviv');
  });

  it('valid aggregates across the tree', () => {
    const form = formState({
      address: formGroup({
        zip: { validators: [required()] as const },
      }),
    });
    expect(form().valid).toBe(false); // zip is required, empty
    form.setValue('address.zip', '12345');
    expect(form().valid).toBe(true);
  });
});

describe('formState — named validators', () => {
  it('errors map is keyed by validator name; null when passing', () => {
    const form = formState({
      age: {
        initial: 18,
        parse: Number,
        validators: [
          { name: 'minAge' as const, fn: (v: number) => v >= 18, message: 'Min 18' },
          { name: 'maxAge' as const, fn: (v: number) => v <= 120 },
        ] as const,
      },
    });
    expect(form().errors.age).toEqual({ minAge: null, maxAge: null });
  });

  it('failing validator sets the message at its key', () => {
    const form = formState({
      age: {
        initial: 5,
        parse: Number,
        validators: [
          { name: 'minAge' as const, fn: (v: number) => v >= 18, message: 'Min 18' },
        ] as const,
      },
    });
    expect(form().errors.age.minAge).toBe('Min 18');
  });

  it('missing message falls back to the validator name', () => {
    const form = formState({
      age: {
        initial: 200,
        parse: Number,
        validators: [
          { name: 'maxAge' as const, fn: (v: number) => v <= 120 },
        ] as const,
      },
    });
    expect(form().errors.age.maxAge).toBe('maxAge');
  });

  it('independent validators report independent failures', () => {
    const form = formState({
      username: {
        validators: [required(), minLength(3), maxLength(20)] as const,
      },
    });
    expect(form().errors.username).toEqual({
      required: 'Required',
      minLength: 'Min 3 characters',
      maxLength: null,
    });
    form.setValue('username', 'ab');
    expect(form().errors.username).toEqual({
      required: null,
      minLength: 'Min 3 characters',
      maxLength: null,
    });
    form.setValue('username', 'alice');
    expect(form().errors.username).toEqual({
      required: null,
      minLength: null,
      maxLength: null,
    });
  });
});

describe('formState — touched / dirty / pristine', () => {
  it('starts pristine, no fields touched, none dirty', () => {
    const form = formState({ name: { initial: 'alice' } });
    const s = form();
    expect(s.pristine).toBe(true);
    expect(s.touched).toEqual({ name: false });
    expect(s.dirty).toEqual({ name: false });
  });

  it('setValue marks dirty when value differs from initial', () => {
    const form = formState({ name: { initial: 'alice' } });
    form.setValue('name', 'bob');
    expect(form().dirty.name).toBe(true);
    form.setValue('name', 'alice');
    expect(form().dirty.name).toBe(false);
  });

  it('reset clears dirty + touched', () => {
    const form = formState({ name: { initial: 'alice' } });
    form.setValue('name', 'bob');
    form.reset();
    expect(form().dirty.name).toBe(false);
    expect(form().touched.name).toBe(false);
  });
});

describe('built-in validators', () => {
  it('required rejects empty values, accepts non-empty', () => {
    const r = required();
    expect(r.fn('')).toBe(false);
    expect(r.fn(null)).toBe(false);
    expect(r.fn(undefined)).toBe(false);
    expect(r.fn(false)).toBe(false);
    expect(r.fn('x')).toBe(true);
    expect(r.fn(true)).toBe(true);
    expect(r.fn(0)).toBe(true);
    expect(r.htmlAttrs).toEqual({ required: true });
  });

  it('minLength / maxLength carry HTML attrs', () => {
    expect(minLength(3).htmlAttrs).toEqual({ minLength: 3 });
    expect(maxLength(10).htmlAttrs).toEqual({ maxLength: 10 });
    expect(minLength(3).fn('ab')).toBe(false);
    expect(minLength(3).fn('abc')).toBe(true);
    expect(maxLength(3).fn('abcd')).toBe(false);
  });

  it('pattern uses regex.source (no flags)', () => {
    const p = pattern(/^[a-z]+$/i);
    expect(p.htmlAttrs).toEqual({ pattern: '^[a-z]+$' });
    expect(p.fn('Alice')).toBe(true);
    expect(p.fn('ali3e')).toBe(false);
  });

  it('email sets type+inputMode and validates a sane email', () => {
    const e = email();
    expect(e.htmlAttrs).toEqual({ type: 'email', inputMode: 'email' });
    expect(e.fn('a@b.co')).toBe(true);
    expect(e.fn('not-an-email')).toBe(false);
    expect(e.fn('a@b')).toBe(false);
  });

  it('url accepts well-formed URLs', () => {
    expect(url().fn('https://example.com')).toBe(true);
    expect(url().fn('not a url')).toBe(false);
    expect(url().fn('')).toBe(false);
  });

  it('min / max work on numbers', () => {
    expect(min(5).htmlAttrs).toEqual({ min: 5 });
    expect(max(10).htmlAttrs).toEqual({ max: 10 });
    expect(min(5).fn(4)).toBe(false);
    expect(min(5).fn(5)).toBe(true);
    expect(max(10).fn(11)).toBe(false);
  });

  it('integer rejects non-whole numbers', () => {
    expect(integer().fn(3)).toBe(true);
    expect(integer().fn(3.5)).toBe(false);
    expect(integer().fn(Number.NaN)).toBe(false);
  });

  it('oneOf restricts to the listed values', () => {
    const o = oneOf(['US', 'UK', 'CA'] as const);
    expect(o.fn('US')).toBe(true);
    expect(o.fn('FR' as 'US')).toBe(false);
  });

  it('custom preserves the literal name and lets you attach htmlAttrs', () => {
    const c = custom('hasDash', (v: string) => v.includes('-'), 'Needs a dash', {
      pattern: '.*-.*',
    });
    expect(c.name).toBe('hasDash');
    expect(c.message).toBe('Needs a dash');
    expect(c.fn('a-b')).toBe(true);
    expect(c.fn('ab')).toBe(false);
    expect(c.htmlAttrs).toEqual({ pattern: '.*-.*' });
  });
});

describe('formState — full schema with built-ins', () => {
  it('aggregates valid across multiple validators on multiple fields', () => {
    const form = formState({
      email: { validators: [required(), email()] as const },
      username: {
        validators: [
          required(),
          minLength(3),
          maxLength(20),
          pattern(/^[a-z0-9_]+$/i),
        ] as const,
      },
      age: {
        initial: 0,
        parse: Number,
        validators: [required(), min(18), max(120), integer()] as const,
      },
    });

    expect(form().valid).toBe(false);

    form.setValue('email', 'alice@example.com');
    form.setValue('username', 'alice_01');
    form.setValue('age', '25');

    expect(form().valid).toBe(true);
    expect(form().values).toEqual({
      email: 'alice@example.com',
      username: 'alice_01',
      age: 25,
    });
  });
});

describe('formState — reactivity', () => {
  it('the snapshot is reactive: an effect re-runs on field change', () => {
    const form = formState({ name: {} });
    const seen: string[] = [];
    const stop = effect(() => {
      seen.push(form().values.name);
    });
    form.setValue('name', 'alice');
    form.setValue('name', 'bob');
    stop();
    expect(seen).toEqual(['', 'alice', 'bob']);
  });

  it('valid flips reactively as validators pass and fail', () => {
    const form = formState({
      email: { validators: [required(), email()] as const },
    });
    const seen: boolean[] = [];
    const stop = effect(() => {
      seen.push(form().valid);
    });
    form.setValue('email', 'a@b.co');     // valid
    form.setValue('email', '');           // back to invalid (required)
    stop();
    expect(seen).toEqual([false, true, false]);
  });
});

describe('formState — htmlAttrs collection', () => {
  it('htmlAttrs from multiple validators merge on the field', () => {
    const form = formState({
      username: {
        validators: [
          required(),
          minLength(3),
          maxLength(20),
          pattern(/^[a-z0-9_]+$/i),
        ] as const,
      },
    });
    // FieldNode internals: the merged attrs that the bind proxy spreads.
    const field = form.__tree.children.get('username');
    expect(field).toBeDefined();
    if (field && 'htmlAttrs' in field) {
      expect(field.htmlAttrs).toEqual({
        required: true,
        minLength: 3,
        maxLength: 20,
        pattern: '^[a-z0-9_]+$',
      });
    }
  });

  it('checkbox kind seeds type="checkbox" into htmlAttrs', () => {
    const form = formState({ agree: { kind: 'checkbox' as const } });
    const field = form.__tree.children.get('agree');
    if (field && 'htmlAttrs' in field) {
      expect(field.htmlAttrs.type).toBe('checkbox');
    } else {
      throw new Error('expected field');
    }
  });

  it('radio kind seeds type="radio" into htmlAttrs', () => {
    const form = formState({ size: { kind: 'radio' as const } });
    const field = form.__tree.children.get('size');
    if (field && 'htmlAttrs' in field) {
      expect(field.htmlAttrs.type).toBe('radio');
    } else {
      throw new Error('expected field');
    }
  });

  it('a validator overriding type wins over the kind-seeded one', () => {
    const form = formState({
      // Silly combo but verifies precedence: email() sets type='email',
      // which should win over the text-kind absence of a seed.
      contact: { validators: [email()] },
    });
    const field = form.__tree.children.get('contact');
    if (field && 'htmlAttrs' in field) {
      expect(field.htmlAttrs.type).toBe('email');
    } else {
      throw new Error('expected field');
    }
  });

  it('later validators win on conflicting keys', () => {
    const form = formState({
      f: {
        validators: [
          { name: 'a' as const, fn: () => true, htmlAttrs: { type: 'email' as const } },
          { name: 'b' as const, fn: () => true, htmlAttrs: { type: 'url' as const } },
        ] as const,
      },
    });
    const field = form.__tree.children.get('f');
    if (field && 'htmlAttrs' in field) {
      expect(field.htmlAttrs.type).toBe('url');
    } else {
      throw new Error('expected field');
    }
  });
});

describe('valid aggregates across every leaf', () => {
  // Regression: a `required` field buried in a nested group (or one with
  // no UI error display) must still block `valid`. The aggregate walks
  // every leaf — filling some fields doesn't unblock the form until they
  // ALL pass.
  it('valid stays false while any single leaf has a failing validator', () => {
    const form = formState({
      name: { validators: [required()] },
      address: formGroup({
        street: { validators: [required()] },
        city: { validators: [required()] },
        zip: { validators: [required()] },
      }),
    });
    expect(form().valid).toBe(false);

    form.setValue('name', 'alice');
    expect(form().valid).toBe(false);

    form.setValue('address.street', '1 main');
    form.setValue('address.city', 'Tel Aviv');
    expect(form().valid).toBe(false); // zip still empty

    form.setValue('address.zip', '12345');
    expect(form().valid).toBe(true);
  });

  it('clearing then refilling EVERY leaf returns valid to true', () => {
    const form = formState({
      name: { validators: [required()] },
      agree: { kind: 'checkbox' as const, validators: [required()] },
      address: formGroup({
        city: { validators: [required()] },
      }),
    });

    // Fill all → valid.
    form.setValue('name', 'alice');
    form.setValue('agree', true);
    form.setValue('address.city', 'Tel Aviv');
    expect(form().valid).toBe(true);

    // Clear all → invalid.
    form.setValue('name', '');
    form.setValue('agree', false);
    form.setValue('address.city', '');
    expect(form().valid).toBe(false);

    // Refill all → valid again.
    form.setValue('name', 'bob');
    form.setValue('agree', true);
    form.setValue('address.city', 'NYC');
    expect(form().valid).toBe(true);
  });

  it('warns when two validators on one field share a name', () => {
    const warn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    formState({
      password: {
        validators: [
          { name: 'pattern', fn: (v: string) => /[A-Z]/.test(v) },
          { name: 'pattern', fn: (v: string) => /\d/.test(v) },
        ],
      },
    });

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('password');
    expect(warn.mock.calls[0][0]).toContain('"pattern"');
    warn.mockRestore();
  });

  it('does not warn when validator names are distinct', () => {
    const warn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    formState({
      password: {
        validators: [
          { name: 'uppercase', fn: (v: string) => /[A-Z]/.test(v) },
          { name: 'digit', fn: (v: string) => /\d/.test(v) },
        ],
      },
    });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('helper types — FormValues / FormErrors / FormTouched', () => {
  it('FormValues mirrors the schema with parsed value types', () => {
    const form = formState({
      name: {},
      age: { initial: 0, parse: Number },
      address: formGroup({ city: {} }),
    });

    // Compile-time assertion via assignment — wrong shape would fail tsc.
    const v: FormValues<typeof form> = {
      name: 'alice',
      age: 21,
      address: { city: 'TLV' },
    };
    expect(v.name).toBe('alice');
    expect(v.age).toBe(21);
    expect(v.address.city).toBe('TLV');
  });

  it('FormErrors mirrors validator names per field', () => {
    const form = formState({
      age: {
        initial: 0,
        parse: Number,
        validators: [
          { name: 'minAge' as const, fn: (v: number) => v >= 18 },
        ] as const,
      },
    });

    const e: FormErrors<typeof form> = { age: { minAge: null } };
    expect(e.age.minAge).toBeNull();
  });

  it('FormTouched is a tree of booleans', () => {
    const form = formState({
      name: {},
      address: formGroup({ city: {} }),
    });

    const t: FormTouched<typeof form> = { name: false, address: { city: false } };
    expect(t.name).toBe(false);
    expect(t.address.city).toBe(false);
  });
});

describe('callable signal contract', () => {
  it('the handle is brand-marked so useLogic detects it', () => {
    const form = formState({ name: {} });
    const REACTIVE_MARKER = Symbol.for('@react-logic/reactive-accessor');
    expect((form as unknown as Record<symbol, true>)[REACTIVE_MARKER]).toBe(true);
  });

  it('reading form() multiple times returns equivalent snapshots', () => {
    const form = formState({ name: { initial: 'alice' } });
    expect(form()).toEqual(form());
  });
});
