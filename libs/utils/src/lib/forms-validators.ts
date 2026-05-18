import type { HTMLValidationAttrs, ValidatorEntry } from './forms';

/* =============================================================================
 * Built-in validators for `formState`.
 *
 * Each factory returns a `ValidatorEntry` with `name`, `fn`, a default
 * `message`, and (where it makes sense) `htmlAttrs` that ride along into
 * the input's bind props — so `required()` sets the `required` attribute,
 * `email()` flips `type` to `'email'`, `minLength(n)` adds `minLength=n`, etc.
 *
 * Every factory takes an optional final `name` argument that overrides the
 * default key under which the error surfaces. Useful when you want two of
 * the same validator on one field (e.g. two `pattern()` checks for
 * uppercase + digit) — give each a distinct name to avoid the keyed-error
 * map collision.
 *
 * The `<const N>` generic preserves the literal name in the inferred type
 * so `errors.field.<yourName>` stays typed.
 * ============================================================================ */

const isEmpty = (v: unknown): boolean =>
  v === undefined ||
  v === null ||
  v === '' ||
  v === false;

/**
 * Reject empty values. Treats `undefined`, `null`, `''`, and `false`
 * (unchecked checkbox / unselected select) as failures. Pass on everything
 * else.
 *
 * @category Forms
 */
export const required = <const N extends string = 'required'>(
  message = 'Required',
  name: N = 'required' as N
): ValidatorEntry<unknown> & { name: N } => ({
  name,
  fn: (v) => !isEmpty(v),
  message,
  htmlAttrs: { required: true },
});

/**
 * String length must be ≥ `n`. Pairs with the `minLength` HTML attribute.
 *
 * @category Forms
 */
export const minLength = <const N extends string = 'minLength'>(
  n: number,
  message?: string,
  name: N = 'minLength' as N
): ValidatorEntry<string> & { name: N } => ({
  name,
  fn: (v) => typeof v === 'string' && v.length >= n,
  message: message ?? `Min ${n} characters`,
  htmlAttrs: { minLength: n },
});

/**
 * String length must be ≤ `n`.
 *
 * @category Forms
 */
export const maxLength = <const N extends string = 'maxLength'>(
  n: number,
  message?: string,
  name: N = 'maxLength' as N
): ValidatorEntry<string> & { name: N } => ({
  name,
  fn: (v) => typeof v === 'string' && v.length <= n,
  message: message ?? `Max ${n} characters`,
  htmlAttrs: { maxLength: n },
});

/**
 * String must match `regex`. Pairs with the HTML `pattern` attribute —
 * mirrors `regex.source` (flags ignored, which matches HTML semantics).
 *
 * Two `pattern()` validators on one field need distinct names — pass the
 * third arg to disambiguate:
 *
 * ```ts
 * validators: [
 *   pattern(/[A-Z]/, 'Needs uppercase', 'uppercase'),
 *   pattern(/\d/,    'Needs digit',     'digit'),
 * ]
 * // errors.password.uppercase, errors.password.digit
 * ```
 *
 * @category Forms
 */
export const pattern = <const N extends string = 'pattern'>(
  regex: RegExp,
  message = 'Invalid format',
  name: N = 'pattern' as N
): ValidatorEntry<string> & { name: N } => ({
  name,
  fn: (v) => typeof v === 'string' && regex.test(v),
  message,
  htmlAttrs: { pattern: regex.source },
});

const EMAIL_RE =
  // Practical, not RFC-perfect — most apps want this and not the 6822 grammar.
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email format check. Sets `type="email"` and `inputMode="email"`.
 *
 * @category Forms
 */
export const email = <const N extends string = 'email'>(
  message = 'Invalid email',
  name: N = 'email' as N
): ValidatorEntry<string> & { name: N } => ({
  name,
  fn: (v) => typeof v === 'string' && EMAIL_RE.test(v),
  message,
  htmlAttrs: { type: 'email', inputMode: 'email' },
});

/**
 * URL format check via `new URL(value)`. Sets `type="url"` and
 * `inputMode="url"`.
 *
 * @category Forms
 */
export const url = <const N extends string = 'url'>(
  message = 'Invalid URL',
  name: N = 'url' as N
): ValidatorEntry<string> & { name: N } => ({
  name,
  fn: (v) => {
    if (typeof v !== 'string' || v.length === 0) return false;
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  },
  message,
  htmlAttrs: { type: 'url', inputMode: 'url' },
});

/**
 * Number must be ≥ `n`. Sets the HTML `min` attribute.
 *
 * @category Forms
 */
export const min = <const N extends string = 'min'>(
  n: number,
  message?: string,
  name: N = 'min' as N
): ValidatorEntry<number> & { name: N } => ({
  name,
  fn: (v) => typeof v === 'number' && !Number.isNaN(v) && v >= n,
  message: message ?? `Min ${n}`,
  htmlAttrs: { min: n },
});

/**
 * Number must be ≤ `n`. Sets the HTML `max` attribute.
 *
 * @category Forms
 */
export const max = <const N extends string = 'max'>(
  n: number,
  message?: string,
  name: N = 'max' as N
): ValidatorEntry<number> & { name: N } => ({
  name,
  fn: (v) => typeof v === 'number' && !Number.isNaN(v) && v <= n,
  message: message ?? `Max ${n}`,
  htmlAttrs: { max: n },
});

/**
 * Integer (whole-number) check.
 *
 * @category Forms
 */
export const integer = <const N extends string = 'integer'>(
  message = 'Whole numbers only',
  name: N = 'integer' as N
): ValidatorEntry<number> & { name: N } => ({
  name,
  fn: (v) => typeof v === 'number' && Number.isInteger(v),
  message,
});

/**
 * Value must be one of the provided literals. Useful for select / radio
 * fields where the schema doesn't already constrain the type.
 *
 * @category Forms
 */
export const oneOf = <T, const N extends string = 'oneOf'>(
  values: ReadonlyArray<T>,
  message = 'Invalid choice',
  name: N = 'oneOf' as N
): ValidatorEntry<T> & { name: N } => ({
  name,
  fn: (v) => values.includes(v),
  message,
});

/**
 * Build a custom-named validator entry. Useful when you want literal-name
 * inference without the inline-object pattern, or to attach `htmlAttrs` to
 * your own rules.
 *
 * @category Forms
 */
export const custom = <T, const N extends string>(
  name: N,
  fn: (value: T) => boolean,
  message?: string,
  htmlAttrs?: HTMLValidationAttrs
): ValidatorEntry<T> & { name: N } => ({
  name,
  fn,
  ...(message !== undefined ? { message } : {}),
  ...(htmlAttrs !== undefined ? { htmlAttrs } : {}),
});
