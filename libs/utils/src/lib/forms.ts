import { computed, signal } from 'alien-signals';
import { REACTIVE_ACCESSOR_MARKER } from '@react-logic/state';

/* =============================================================================
 * Forms — `formState` + `formGroup`.
 *
 * `formState` returns a callable signal — `form()` produces an atomic snapshot
 * of every field's value, error map, touched/dirty state, and aggregate flags.
 * Internally each leaf has its own signals, so per-field UI bindings only
 * touch the relevant sub-tree; the public `form()` snapshot is what feeds the
 * `useLogic` tracking pass and coarse re-render gate.
 *
 * Errors are **keyed by validator name** — `errors.age.minAge` is the message
 * for the `minAge` rule (string when failed, null when valid). Built-in
 * validator factories (`required`, `minLength`, …) live in
 * `forms-validators.ts`.
 *
 * Schemas can nest via `formGroup({...})`. The brand-symbol marker is the
 * only way the tree walker distinguishes "field with config" from "group of
 * fields" — empty-config field `{}` and one-child group `{ city: {} }` would
 * be ambiguous otherwise.
 * ============================================================================ */

/* -----------------------------------------------------------------------------
 * Brand for `formGroup`
 * ------------------------------------------------------------------------- */

declare const FORM_GROUP_BRAND: unique symbol;
const FORM_GROUP_MARKER = Symbol.for('@react-logic/form-group');

/**
 * Mark an object literal as a nested **group** inside a form schema. Plain
 * objects without this marker are treated as field configs.
 *
 * @category Forms
 * @example
 * ```ts
 * formState({
 *   name:    {},
 *   email:   {},
 *   address: formGroup({
 *     street: {},
 *     city:   {},
 *     zip:    {},
 *   }),
 * });
 * ```
 */
export function formGroup<S extends Schema>(schema: S): FormGroup<S> {
  return { [FORM_GROUP_MARKER]: true, schema } as unknown as FormGroup<S>;
}

/**
 * Brand returned by `formGroup`. Don't construct directly.
 *
 * @category Forms
 */
export interface FormGroup<S extends Schema = Schema> {
  readonly [FORM_GROUP_BRAND]: true;
  readonly schema: S;
}

const isFormGroup = (v: unknown): v is FormGroup =>
  typeof v === 'object' && v !== null && FORM_GROUP_MARKER in v;

/* -----------------------------------------------------------------------------
 * Schema + validator types
 * ------------------------------------------------------------------------- */

/** Subset of input HTML attributes that ride along with a validator. */
export interface HTMLValidationAttrs {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  type?:
    | 'text'
    | 'email'
    | 'url'
    | 'tel'
    | 'number'
    | 'password'
    | 'search'
    | 'date'
    | 'datetime-local'
    | 'time'
    | 'week'
    | 'month'
    | 'color'
    | 'checkbox'
    | 'radio';
  inputMode?:
    | 'none'
    | 'text'
    | 'decimal'
    | 'numeric'
    | 'tel'
    | 'search'
    | 'email'
    | 'url';
}

/**
 * One validation rule on a field. `name` is required (becomes the error key
 * in the snapshot's `errors` tree); `message` defaults to `name` on failure;
 * `htmlAttrs` ride along into the input's bind props.
 *
 * @typeParam T - The field's value type.
 * @category Forms
 */
export interface ValidatorEntry<T> {
  readonly name: string;
  readonly fn: (value: T) => boolean;
  readonly message?: string;
  readonly htmlAttrs?: HTMLValidationAttrs;
}

/**
 * Per-field configuration. All fields optional — an empty `{}` is a text
 * field with no validators and `''` as the initial.
 *
 * @typeParam T - The field's value type.
 * @category Forms
 */
export interface FieldConfig<T = string> {
  readonly initial?: T;
  readonly kind?: 'text' | 'checkbox' | 'select' | 'radio';
  readonly parse?: (raw: string) => T;
  readonly validators?: ReadonlyArray<ValidatorEntry<T>>;
}

/** Top-level schema — keys are field names, values are configs or groups.
 *  Uses `any` because `FieldConfig<T>`'s contravariant `fn` parameter makes
 *  e.g. `FieldConfig<number>` not assignable to `FieldConfig<unknown>` — but
 *  the schema needs to accept either. Inference downstream is preserved by
 *  the `const S extends Schema` constraint on `formState`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Schema = { readonly [key: string]: FieldConfig<any> | FormGroup<any> };

/* -----------------------------------------------------------------------------
 * Inference types — recursive walks over the schema.
 * ------------------------------------------------------------------------- */

/** Resolve a field's value type from its config — uses `initial` first, then
 *  defaults from `kind`. */
type FieldValue<C> =
  C extends { initial: infer T } ? T :
  C extends { kind: 'checkbox' } ? boolean :
                                    string;

/** Recursive tree of resolved field values. */
export type Values<S> = {
  [K in keyof S]:
    S[K] extends FormGroup<infer Inner> ? Values<Inner> :
    S[K] extends FieldConfig<infer _> ? FieldValue<S[K]> :
    never;
};

/** Pull validator names out of a field's `validators` array, preserving the
 *  literal-string union. */
type ValidatorName<C> = C extends {
  validators: ReadonlyArray<infer V>;
}
  ? V extends { name: infer N extends string }
    ? N
    : never
  : never;

/** Per-field errors keyed by validator name — `string | null` per key. */
export type FieldErrors<C> = {
  [N in ValidatorName<C>]: string | null;
};

/** Recursive tree of per-field error maps. */
export type Errors<S> = {
  [K in keyof S]:
    S[K] extends FormGroup<infer Inner> ? Errors<Inner> :
    S[K] extends FieldConfig<infer _> ? FieldErrors<S[K]> :
    never;
};

/** Recursive tree of booleans — `touched`, `dirty`. */
export type BoolTree<S> = {
  [K in keyof S]:
    S[K] extends FormGroup<infer Inner> ? BoolTree<Inner> :
    S[K] extends FieldConfig<infer _> ? boolean :
    never;
};

/** Atomic form-state snapshot returned by `form()`. */
export interface FormSnapshot<S> {
  readonly values: Values<S>;
  readonly errors: Errors<S>;
  readonly touched: BoolTree<S>;
  readonly dirty: BoolTree<S>;
  readonly valid: boolean;
  readonly pristine: boolean;
  readonly submitting: boolean;
  readonly submitted: boolean;
}

/**
 * Callable form-state signal. Read with `()`, mutate via `setValue` /
 * `setError` / `reset`. The `useForm` hook reads the underlying tree for
 * its bind/error proxies.
 *
 * @typeParam S - The schema.
 * @category Forms
 */
export interface FormHandle<S extends Schema> {
  (): FormSnapshot<S>;
  setValue(path: string, value: unknown): void;
  setError(path: string, error: string | null): void;
  reset(): void;
  /** @internal — used by `useForm` to build proxies. Not stable API. */
  readonly __tree: GroupNode;
  /** @internal — submission lifecycle hook. */
  readonly __markAllTouched: () => void;
  /** @internal */
  readonly __setSubmitting: (v: boolean) => void;
  /** @internal */
  readonly __setSubmitted: (v: boolean) => void;
  [REACTIVE_ACCESSOR_MARKER]: true;
}

/* -----------------------------------------------------------------------------
 * Public helper types — extract the per-field shapes from a FormHandle.
 *
 * Useful for typing submit handlers and reusable accessors without writing
 * `ReturnType<typeof this.form>['values']` every time.
 *
 * ```ts
 * class SignupLogic {
 *   form = formState({ email: {}, age: { initial: 0, parse: Number } });
 *
 *   submit(values: FormValues<typeof this.form>) {
 *     // values.email: string; values.age: number
 *   }
 * }
 * ```
 * ------------------------------------------------------------------------- */

/** Inferred `values` tree from a `FormHandle`. */
export type FormValues<H> =
  H extends FormHandle<infer S> ? Values<S> : never;

/** Inferred `errors` tree from a `FormHandle`. */
export type FormErrors<H> =
  H extends FormHandle<infer S> ? Errors<S> : never;

/** Inferred `touched` tree from a `FormHandle`. */
export type FormTouched<H> =
  H extends FormHandle<infer S> ? BoolTree<S> : never;

/** Inferred `dirty` tree from a `FormHandle`. */
export type FormDirty<H> =
  H extends FormHandle<infer S> ? BoolTree<S> : never;

/** Inferred full snapshot from a `FormHandle`. */
export type FormState<H> =
  H extends FormHandle<infer S> ? FormSnapshot<S> : never;

/* -----------------------------------------------------------------------------
 * Internal tree — Field + Group nodes
 * ------------------------------------------------------------------------- */

type Signal<T> = ReturnType<typeof signal<T>>;

export class FieldNode<T = unknown> {
  readonly path: string;
  readonly pathKey: string;
  readonly initial: T;
  readonly kind: 'text' | 'checkbox' | 'select' | 'radio';
  readonly parse?: (raw: string) => T;
  readonly validators: ReadonlyArray<ValidatorEntry<T>>;
  readonly htmlAttrs: HTMLValidationAttrs;

  /** Underlying raw input (string for text/select/radio, boolean for checkbox). */
  readonly rawValue: Signal<string | boolean>;
  /** Touched state — flips true on blur or on submit. */
  readonly touched: Signal<boolean>;

  /** Parsed/typed value — read this for `values`. */
  readonly value: () => T;
  /** Per-validator-name error map. */
  readonly errors: () => Record<string, string | null>;
  /** Dirty = value differs from initial. */
  readonly dirty: () => boolean;

  constructor(path: string[], config: FieldConfig<T>) {
    this.pathKey = path[path.length - 1] ?? '';
    this.path = path.join('.');
    this.kind = config.kind ?? 'text';
    this.parse = config.parse;
    this.validators = config.validators ?? [];

    // Resolve initial value from config or kind default.
    if ('initial' in config && config.initial !== undefined) {
      this.initial = config.initial as T;
    } else if (this.kind === 'checkbox') {
      this.initial = false as unknown as T;
    } else {
      this.initial = '' as unknown as T;
    }

    this.rawValue = signal<string | boolean>(
      this.kind === 'checkbox' ? (this.initial as unknown as boolean) : this.toRaw(this.initial)
    );
    this.touched = signal(false);

    // Merge htmlAttrs from all validators (later validators win on the same
    // key). Pre-seed with the kind-derived `type` so consumers can spread
    // `Form.bind.field` straight onto a bare `<input>` without repeating
    // `type="checkbox"` / `type="radio"` in JSX. A validator's `type` (e.g.
    // `email()` setting `type: 'email'`) still wins on a text field.
    const seeded: HTMLValidationAttrs = {};
    if (this.kind === 'checkbox') seeded.type = 'checkbox';
    else if (this.kind === 'radio') seeded.type = 'radio';
    this.htmlAttrs = this.validators.reduce<HTMLValidationAttrs>(
      (acc, v) => ({ ...acc, ...(v.htmlAttrs ?? {}) }),
      seeded
    );

    // Detect duplicate validator names — they silently collide in the
    // keyed errors map (last write wins), which masks failures. Warn in
    // dev; the user can rename via `custom('uppercase', …)` etc.
    const names = new Set<string>();
    for (const v of this.validators) {
      if (names.has(v.name)) {
        // eslint-disable-next-line no-console
        console.warn(
          `[formState] Field "${this.path}" has two validators named "${v.name}". ` +
            `Errors are keyed by name — the second one overwrites the first. ` +
            `Use \`custom('unique-name', fn, message)\` to disambiguate.`
        );
      }
      names.add(v.name);
    }

    // `value` — parse the raw if kind is text-ish, else pass-through.
    this.value = computed(() => {
      const raw = this.rawValue();
      if (this.kind === 'checkbox') return raw as unknown as T;
      if (this.parse) return this.parse(raw as string);
      return raw as unknown as T;
    });

    // `errors` — run every validator, key by name.
    this.errors = computed(() => {
      const v = this.value();
      const out: Record<string, string | null> = {};
      for (const validator of this.validators) {
        out[validator.name] = validator.fn(v)
          ? null
          : validator.message ?? validator.name;
      }
      return out;
    });

    this.dirty = computed(() => !deepEqual(this.value(), this.initial));
  }

  private toRaw(value: T): string {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  reset(): void {
    this.rawValue(
      this.kind === 'checkbox'
        ? (this.initial as unknown as boolean)
        : this.toRaw(this.initial)
    );
    this.touched(false);
  }

  isValid(): boolean {
    const errs = this.errors();
    for (const key in errs) if (errs[key] !== null) return false;
    return true;
  }
}

export class GroupNode {
  readonly path: string;
  readonly children: Map<string, FieldNode | GroupNode>;

  constructor(path: string[], children: Map<string, FieldNode | GroupNode>) {
    this.path = path.join('.');
    this.children = children;
  }

  reset(): void {
    for (const child of this.children.values()) child.reset();
  }

  isValid(): boolean {
    for (const child of this.children.values()) {
      if (!child.isValid()) return false;
    }
    return true;
  }

  isPristine(): boolean {
    for (const child of this.children.values()) {
      if (child instanceof FieldNode) {
        if (child.touched()) return false;
      } else if (!child.isPristine()) return false;
    }
    return true;
  }

  markAllTouched(): void {
    for (const child of this.children.values()) {
      if (child instanceof FieldNode) child.touched(true);
      else child.markAllTouched();
    }
  }
}

const buildTree = (schema: Schema, path: string[] = []): GroupNode => {
  // Internal map uses `unknown` for the field type — variance issues at this
  // layer are noise; the public types preserve the real T via the inference
  // chain elsewhere.
  const children = new Map<string, FieldNode<unknown> | GroupNode>();
  for (const [key, entry] of Object.entries(schema)) {
    const childPath = [...path, key];
    if (isFormGroup(entry)) {
      children.set(key, buildTree(entry.schema, childPath));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children.set(key, new FieldNode<any>(childPath, entry as FieldConfig<any>));
    }
  }
  return new GroupNode(path, children);
};

const walkBy = <T>(
  group: GroupNode,
  pickField: (f: FieldNode) => T
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [key, child] of group.children) {
    out[key] = child instanceof FieldNode ? pickField(child) : walkBy(child, pickField);
  }
  return out;
};

const findField = (tree: GroupNode, path: string): FieldNode | undefined => {
  const parts = path.split('.');
  let cur: FieldNode | GroupNode | undefined = tree;
  for (const part of parts) {
    if (!(cur instanceof GroupNode)) return undefined;
    cur = cur.children.get(part);
    if (!cur) return undefined;
  }
  return cur instanceof FieldNode ? cur : undefined;
};

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a === 'object') {
    const ak = Object.keys(a as object);
    const bk = Object.keys(b as object);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
        return false;
    }
    return true;
  }
  return false;
};

/* -----------------------------------------------------------------------------
 * formState — the public entry point
 * ------------------------------------------------------------------------- */

/**
 * Build a reactive form. Returns a callable signal — `form()` produces an
 * atomic `FormSnapshot` (values, errors, touched, dirty, plus aggregate
 * `valid` / `pristine` / `submitting` / `submitted`).
 *
 * Schema is recursive — use {@link formGroup} for nested objects.
 * Empty `{}` is a text field with `''` initial. `kind: 'checkbox'` defaults
 * to `false`. Built-in validator factories live next to this module.
 *
 * @typeParam S - The schema. Use the `const` modifier so validator-name
 *   literals propagate to `errors` typing.
 * @category Forms
 */
export function formState<S extends Schema>(schema: S): FormHandle<S> {
  const tree = buildTree(schema);
  const submitting = signal(false);
  const submitted = signal(false);

  const snapshot = computed<FormSnapshot<S>>(() => ({
    values: walkBy(tree, (f) => f.value()) as Values<S>,
    errors: walkBy(tree, (f) => f.errors()) as Errors<S>,
    touched: walkBy(tree, (f) => f.touched()) as BoolTree<S>,
    dirty: walkBy(tree, (f) => f.dirty()) as BoolTree<S>,
    valid: tree.isValid(),
    pristine: tree.isPristine(),
    submitting: submitting(),
    submitted: submitted(),
  }));

  const handle = (() => snapshot()) as FormHandle<S>;

  handle.setValue = (path: string, value: unknown) => {
    const field = findField(tree, path);
    if (!field) return;
    if (field.kind === 'checkbox') {
      field.rawValue(value as boolean);
    } else {
      field.rawValue(typeof value === 'string' ? value : String(value));
    }
  };

  handle.setError = (_path: string, _error: string | null) => {
    // External error injection — for now this is a no-op placeholder.
    // (Per-field errors are derived from validators; adding ad-hoc overrides
    // would require a side-channel signal per field. Defer until needed.)
  };

  handle.reset = () => {
    tree.reset();
    submitting(false);
    submitted(false);
  };

  Object.defineProperty(handle, '__tree', { value: tree, enumerable: false });
  Object.defineProperty(handle, '__markAllTouched', {
    value: () => tree.markAllTouched(),
    enumerable: false,
  });
  Object.defineProperty(handle, '__setSubmitting', {
    value: (v: boolean) => submitting(v),
    enumerable: false,
  });
  Object.defineProperty(handle, '__setSubmitted', {
    value: (v: boolean) => submitted(v),
    enumerable: false,
  });
  (handle as unknown as Record<symbol, true>)[REACTIVE_ACCESSOR_MARKER] = true;

  return handle;
}
