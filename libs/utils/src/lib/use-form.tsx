import {
  type ChangeEvent,
  type FC,
  type FormEvent,
  type FormHTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  useMemo,
} from 'react';
import {
  FieldNode,
  GroupNode,
  type FormHandle,
  type Schema,
  type Values,
} from './forms';

/* =============================================================================
 * useForm — React glue.
 *
 * Returns a `<Form>` component augmented with two proxies:
 *   - `Form.bind.*`  — leaves spread into `<input>` props (value/onChange/
 *                       onBlur/name + any htmlAttrs from the validators).
 *   - `Form.error.*` — leaves resolve to the per-validator-name error map
 *                       `{ minAge: string | null, … }`.
 *
 * Both proxies mirror the schema tree — `Form.bind.address.city` is the
 * leaf at `address.city`. Spreading the bind leaf into an input
 * synchronously reads the underlying field signals, which is how the
 * component subscribes to updates.
 *
 * The `<Form>` element renders `<form noValidate>` by default — the lib's
 * JS validators are the source of truth for error messages. Pass
 * `noValidate={false}` to let the browser also run native validation on
 * submit.
 * ============================================================================ */

/** Props on the rendered `<Form>` component. */
export interface FormProps<S extends Schema>
  extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  children: ReactNode;
  /**
   * Called with the typed values on a valid submit. Receives `Values<S>`
   * — the parsed-and-typed snapshot, not the raw input strings.
   * Invalid submits are swallowed after marking every field touched.
   */
  onSubmit: (values: Values<S>) => void | Promise<void>;
}

/** Bind-prop shape for a single leaf — kind-dependent. */
type BindProps = {
  name: string;
  onBlur: () => void;
} & (
  | { value: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void }
  | { checked: boolean; onChange: (e: ChangeEvent<HTMLInputElement>) => void }
);

/** Recursive bind tree shape. */
type Bind<S> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof S]: S[K] extends { schema: infer Inner } ? Bind<Inner> : BindProps;
};

/** Recursive error tree shape. */
type ErrorTree<S> = {
  [K in keyof S]: S[K] extends { schema: infer Inner }
    ? ErrorTree<Inner>
    : Record<string, string | null>;
};

/** Component type for a single field — `<select>` for select-kind, `<input>`
 *  otherwise. The user-supplied props are merged with bind props; the
 *  reactive bits (`value`/`checked`/`onChange`/`onBlur`/`name`) always win
 *  over user overrides, htmlAttrs (`type`/`required`/`pattern`/…) are
 *  user-overridable. */
type InputComponent<C> = C extends { kind: 'select' }
  ? FC<Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'value' | 'onChange' | 'onBlur'>>
  : FC<Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'value' | 'checked' | 'onChange' | 'onBlur'>>;

/** Recursive tree of per-field input components. */
type Inputs<S> = {
  [K in keyof S]: S[K] extends { schema: infer Inner }
    ? Inputs<Inner>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : InputComponent<S[K] extends { kind: any } ? S[K] : { kind: 'text' }>;
};

/**
 * Bound form component returned by `useForm`. Renders a `<form>` element
 * and exposes three proxies as properties: `bind` (raw props to spread),
 * `error` (per-validator-name error maps), and `inputs` (pre-built
 * `<input>` / `<select>` components per field — sugar for the common
 * spread case).
 *
 * @category Forms
 */
export type FormComponent<S extends Schema> = ((props: FormProps<S>) => ReactElement) & {
  readonly bind: Bind<S>;
  readonly error: ErrorTree<S>;
  readonly inputs: Inputs<S>;
};

const buildBindProps = (field: FieldNode): BindProps => {
  const onBlur = () => field.touched(true);
  if (field.kind === 'checkbox') {
    return {
      name: field.path,
      checked: field.rawValue() as boolean,
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        field.rawValue(e.target.checked),
      onBlur,
      ...field.htmlAttrs,
    } as BindProps;
  }
  return {
    name: field.path,
    value: field.rawValue() as string,
    onChange: (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => field.rawValue(e.target.value),
    onBlur,
    ...field.htmlAttrs,
  } as BindProps;
};

const buildBindProxy = (
  group: GroupNode,
  cache: Map<string, object>
): object =>
  new Proxy(
    {},
    {
      get(_target, key) {
        if (typeof key !== 'string') return undefined;
        const child = group.children.get(key);
        if (!child) return undefined;
        if (child instanceof FieldNode) {
          // Fresh props on each access — reads the signal synchronously so
          // the consuming component subscribes properly.
          return buildBindProps(child);
        }
        const cacheKey = `${group.path}.${key}`;
        let nested = cache.get(cacheKey);
        if (!nested) {
          nested = buildBindProxy(child, cache);
          cache.set(cacheKey, nested);
        }
        return nested;
      },
    }
  );

/* -----------------------------------------------------------------------------
 * `Form.inputs.<path>` — pre-built input/select components per field.
 *
 * Each leaf is a memoised React FC that renders the appropriate element
 * (`<input>` for text/checkbox/radio, `<select>` for select) with the
 * field's bind props already wired in. User-supplied props pass through;
 * the reactive props (value/checked/onChange/onBlur/name) always win on
 * conflict, the htmlAttrs from validators are user-overridable.
 * ------------------------------------------------------------------------- */

const makeInputComponent = (field: FieldNode): FC<Record<string, unknown>> => {
  const onBlur = () => field.touched(true);

  let Component: FC<Record<string, unknown>>;

  if (field.kind === 'select') {
    Component = (userProps) => (
      <select
        {...(field.htmlAttrs as Record<string, unknown>)}
        {...userProps}
        name={field.path}
        value={field.rawValue() as string}
        onChange={(e) => field.rawValue(e.target.value)}
        onBlur={onBlur}
      >
        {(userProps as { children?: ReactNode }).children}
      </select>
    );
  } else if (field.kind === 'checkbox') {
    Component = (userProps) => (
      <input
        {...(field.htmlAttrs as Record<string, unknown>)}
        {...userProps}
        name={field.path}
        checked={field.rawValue() as boolean}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          field.rawValue(e.target.checked)
        }
        onBlur={onBlur}
      />
    );
  } else {
    // text + radio share the value-shaped binding.
    Component = (userProps) => (
      <input
        {...(field.htmlAttrs as Record<string, unknown>)}
        {...userProps}
        name={field.path}
        value={field.rawValue() as string}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          field.rawValue(e.target.value)
        }
        onBlur={onBlur}
      />
    );
  }

  Component.displayName = `Form.inputs.${field.path}`;
  return Component;
};

const buildInputsProxy = (
  group: GroupNode,
  cache: Map<string, object>
): object =>
  new Proxy(
    {},
    {
      get(_target, key) {
        if (typeof key !== 'string') return undefined;
        const child = group.children.get(key);
        if (!child) return undefined;
        const cacheKey = `inputs:${group.path}.${key}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;
        const next =
          child instanceof FieldNode
            ? makeInputComponent(child)
            : buildInputsProxy(child, cache);
        cache.set(cacheKey, next as object);
        return next;
      },
    }
  );

const buildErrorProxy = (
  group: GroupNode,
  cache: Map<string, object>
): object =>
  new Proxy(
    {},
    {
      get(_target, key) {
        if (typeof key !== 'string') return undefined;
        const child = group.children.get(key);
        if (!child) return undefined;
        if (child instanceof FieldNode) {
          // Returns the live error map; the read subscribes via the
          // underlying computed.
          return child.errors();
        }
        const cacheKey = `${group.path}.${key}`;
        let nested = cache.get(cacheKey);
        if (!nested) {
          nested = buildErrorProxy(child, cache);
          cache.set(cacheKey, nested);
        }
        return nested;
      },
    }
  );

/**
 * Bind a `FormHandle` to a React component. Returns a `<Form>` component
 * whose `bind` and `error` properties are proxies mirroring the schema —
 * spread `Form.bind.email` into an `<input>`, read `Form.error.email` to
 * branch on per-validator failures.
 *
 * ```tsx
 * const Signup = () => {
 *   const logic = useLogic(SignupLogic);
 *   const Form = useForm(logic.form);
 *   return (
 *     <Form onSubmit={(values) => logic.submit(values)}>
 *       <input {...Form.bind.email} />
 *       {Form.error.email.required && <p>Email is required</p>}
 *       <input {...Form.bind.address.city} />
 *       <button type="submit" disabled={!logic.form().valid}>Sign up</button>
 *     </Form>
 *   );
 * };
 * ```
 *
 * @typeParam S - The schema (inferred from `handle`).
 * @category Forms
 */
export function useForm<S extends Schema>(
  handle: FormHandle<S>
): FormComponent<S> {
  return useMemo(() => {
    const proxyCache = new Map<string, object>();
    const tree = handle.__tree;

    const Form = ({
      children,
      onSubmit,
      noValidate = true,
      ...rest
    }: FormProps<S>): ReactElement => {
      const onSubmitImpl = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handle.__markAllTouched();
        const snap = handle();
        if (!snap.valid) return;
        handle.__setSubmitting(true);
        const ret = onSubmit(snap.values);
        if (ret && typeof (ret as Promise<unknown>).then === 'function') {
          (ret as Promise<unknown>).finally(() => {
            handle.__setSubmitting(false);
            handle.__setSubmitted(true);
          });
        } else {
          handle.__setSubmitting(false);
          handle.__setSubmitted(true);
        }
      };
      return (
        <form noValidate={noValidate} {...rest} onSubmit={onSubmitImpl}>
          {children}
        </form>
      );
    };

    const augmented = Form as FormComponent<S>;
    Object.defineProperty(augmented, 'bind', {
      value: buildBindProxy(tree, proxyCache),
      writable: false,
    });
    Object.defineProperty(augmented, 'error', {
      value: buildErrorProxy(tree, proxyCache),
      writable: false,
    });
    Object.defineProperty(augmented, 'inputs', {
      value: buildInputsProxy(tree, proxyCache),
      writable: false,
    });
    return augmented;
  }, [handle]);
}
