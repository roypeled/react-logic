---
sidebar_position: 5
---

# Forms

Reactive forms backed by a logic class. `formState` defines the schema; `useForm` binds it to a React component with a typed `bind` proxy. Validators are named and per-field, with HTML attributes that ride along into the rendered inputs. Lives in `@react-logic/utils`.

```sh
npm install @react-logic/utils
```

## At a glance

```tsx
import { useLogic } from '@react-logic/react-logic';
import {
  formState,
  formGroup,
  useForm,
  type FormValues,
  required,
  email,
  minLength,
  maxLength,
} from '@react-logic/utils';

class SignupLogic {
  form = formState({
    email:    { validators: [required(), email()] },
    username: { validators: [required(), minLength(3), maxLength(20)] },
    agree:    { kind: 'checkbox', validators: [required('You must agree')] },
    address:  formGroup({
      street: {},
      city:   { validators: [required()] },
      zip:    {},
    }),
  });

  submit(values: FormValues<typeof this.form>) {
    // typed values — `values.email`, `values.address.zip`, etc.
  }
}

const Signup = () => {
  const logic = useLogic(SignupLogic);
  const Form = useForm(logic.form);
  return (
    <Form onSubmit={(v) => logic.submit(v)}>
      <Form.inputs.email placeholder="Email" />
      {Form.error.email.required && <p>{Form.error.email.required}</p>}
      {Form.error.email.email && <p>{Form.error.email.email}</p>}

      <Form.inputs.username placeholder="Username" />
      <Form.inputs.agree /> I agree

      <fieldset>
        <Form.inputs.address.street placeholder="Street" />
        <Form.inputs.address.city placeholder="City" />
        <Form.inputs.address.zip placeholder="ZIP" />
      </fieldset>

      <button type="submit" disabled={!logic.form().valid}>Sign up</button>
    </Form>
  );
};
```

## Schema

Each key in the schema is either a **field config** or a **group** (marked with `formGroup`). The shape recurses arbitrarily.

```ts
type FieldConfig<T> = {
  initial?:    T;                                  // default depends on kind
  kind?:       'text' | 'checkbox' | 'select' | 'radio';
  parse?:      (raw: string) => T;                 // raw-input → typed value
  validators?: ValidatorEntry<T>[];
};
```

Every property is optional. Empty `{}` is a `text` field with `''` initial. `kind: 'checkbox'` defaults `initial` to `false`. Explicit `initial` always wins and narrows further:

```ts
country: { initial: 'US' as 'US' | 'UK', kind: 'select' }
```

`parse` runs on every raw-input write; without it, the field's typed value is the raw string. For number inputs:

```ts
age: { initial: 0, parse: Number, validators: [min(18), max(120), integer()] }
```

### Groups

```ts
formState({
  address: formGroup({
    street: {},
    city:   {},
    zip:    {},
  }),
});
```

`formGroup` is the marker that tells the schema walker "this is nested, not a field." Without it, `{ city: {} }` would be ambiguous (a field with a `city` config option? a group of one field?). The marker resolves it.

Empty groups are allowed — `formGroup({})` is a valid placeholder for later filling.

## Single-signal snapshot

`form()` returns one atomic snapshot:

```ts
interface FormSnapshot<S> {
  values:     Values<S>;       // typed tree, the parsed-and-typed shape
  errors:     Errors<S>;       // tree of { [validatorName]: string | null }
  touched:    BoolTree<S>;     // recursive booleans
  dirty:      BoolTree<S>;     // recursive booleans
  valid:      boolean;         // every leaf has all-null errors
  pristine:   boolean;         // no field has been touched
  submitting: boolean;         // between submit-start and resolve
  submitted:  boolean;         // ever-submitted-successfully flag
}
```

Reading `form()` from a logic-class field (via the `useLogic` tracking pass) subscribes the component to any change in any field. Most apps want the whole snapshot anyway (for `valid` / `submitting` on the submit button); when you don't, the bind proxies read individual fields without touching `form()`.

## Validators

Each entry has a required `name` (becomes the error-map key), a `fn` predicate, and an optional `message` + `htmlAttrs`.

```ts
interface ValidatorEntry<T> {
  name:       string;
  fn:         (value: T) => boolean;
  message?:   string;
  htmlAttrs?: HTMLValidationAttrs;
}
```

The error at `errors.<field>.<validatorName>` is:

- `null` when the validator passes,
- the `message` string when it fails,
- the `name` string when it fails and no `message` was set.

Truthy = failed, falsy = valid:

```tsx
{Form.error.email.required && <p>Email is required</p>}
{Form.error.username.minLength && <p>{Form.error.username.minLength}</p>}
```

### Built-in validators

Ship from `@react-logic/utils`. Each sets `name`, sensible `message`, and (where relevant) `htmlAttrs`:

| Factory | Field type | Sets HTML attr |
|---|---|---|
| `required(message?)` | any | `required` |
| `minLength(n, message?)` | string | `minLength` |
| `maxLength(n, message?)` | string | `maxLength` |
| `pattern(regex, message?)` | string | `pattern` (from `regex.source`) |
| `email(message?)` | string | `type=email`, `inputMode=email` |
| `url(message?)` | string | `type=url`, `inputMode=url` |
| `min(n, message?)` | number | `min` |
| `max(n, message?)` | number | `max` |
| `integer(message?)` | number | — |
| `oneOf(values, message?)` | T | — |
| `custom(name, fn, message?, htmlAttrs?)` | T | as supplied |

Compose freely — multiple validators on the same field all run, all report independently:

```ts
{
  validators: [
    required(),
    minLength(3, 'At least 3'),
    maxLength(20),
    pattern(/^[a-z0-9_]+$/i, 'Letters, digits, underscore only'),
  ],
}
```

All four entries get their own keyed error slot.

### Custom validators

The literal `name` flows into the error type, so `errors.field.yourName` is statically known:

```ts
import { custom } from '@react-logic/utils';

validators: [
  custom('hasUppercase', (v: string) => /[A-Z]/.test(v), 'At least one uppercase'),
  custom('hasDigit',     (v: string) => /\d/.test(v),    'At least one digit'),
]
```

For one-offs without the helper, an inline object literal works too — the `formState<const S>` generic preserves the literal `name` automatically.

## HTML attrs ride along into bindings

Each validator can carry `htmlAttrs` that the bind proxy merges into the input's props:

```tsx
<input {...Form.bind.username} />

// Renders:
// <input
//   name="username"
//   value="..."
//   onChange={...}
//   onBlur={...}
//   required
//   minLength={3}
//   maxLength={20}
//   pattern="^[a-z0-9_]+$"
// />
```

Benefits:
- **Accessibility** — `required` is read by assistive tech.
- **Mobile keyboards** — `inputMode="email"` shows the email keyboard.
- **Semantic input types** — `type="email"` triggers built-in input parsing.

`<Form>` renders `<form noValidate>` by default — your JS validators are the source of truth for error messages, browsers won't show their own pop-ups. Override per-form with `<Form noValidate={false}>` to opt back into native validation.

## `Form.inputs.<path>` — sugar over `bind`

`Form.inputs` is a pre-built React component per field. Same shape as `bind` — `Form.inputs.email`, `Form.inputs.address.city` — but instead of spreading into your own `<input>` you render it directly:

```tsx
<Form.inputs.email placeholder="Email" />
<Form.inputs.username className="big" />
<Form.inputs.agree />
<Form.inputs.address.city placeholder="City" />
```

Each component:

- Renders `<select>` for `kind: 'select'`, `<input>` otherwise (checkbox/radio just set `type` via the bind).
- Wires the bind props (value/checked/onChange/onBlur/name) — these always win over any user-supplied prop with the same name.
- Forwards every other prop you pass — `placeholder`, `className`, `aria-*`, `id`, etc.
- Has a stable identity per field (memoised by path), so React doesn't remount on every parent render.

For `<select>`, pass `<option>` children through:

```tsx
<Form.inputs.country>
  <option value="">Choose…</option>
  <option value="US">US</option>
  <option value="UK">UK</option>
</Form.inputs.country>
```

When you need more control than the sugar offers — a custom wrapper, a different element type, a third-party styled component — drop back to `<input {...Form.bind.field} />`. The two surfaces are interchangeable.

### ESLint and the `react/jsx-pascal-case` rule

`eslint-plugin-react`'s `react/jsx-pascal-case` rule flags `<Form.inputs.email />` because field names are camelCase. Three options:

- **Use `Form.bind` instead** — `<input {...Form.bind.email} />`. The rule only checks JSX *component* names; spreading into a regular `<input>` doesn't trigger it.
- **Disable the rule for files using the sugar:**
  ```js
  rules: { 'react/jsx-pascal-case': 'off' }
  ```
  The repo's `demos/forms` app does exactly this.
- **Inline disable** at the call site for one-off cases:
  ```tsx
  {/* eslint-disable-next-line react/jsx-pascal-case */}
  <Form.inputs.email />
  ```

Pick whichever fits your codebase. The `Form.bind` surface is fully equivalent — the sugar is for ergonomics, not semantics.

## bind & error proxies

`Form.bind` mirrors the schema tree. Leaves spread into inputs. Groups become nested proxy branches:

```tsx
<input {...Form.bind.email} />
<input {...Form.bind.address.zip} />
<input {...Form.bind.contact.primary.phone} />
```

The leaf props change shape based on `kind`:

- **text / select** → `{ name, value, onChange, onBlur, …htmlAttrs }`
- **checkbox** → `{ name, checked, onChange, onBlur, type: 'checkbox', …htmlAttrs }`
- **radio** → `{ name, value, onChange, onBlur, type: 'radio', …htmlAttrs }`

For checkbox and radio, the bind sets `type` automatically — spread the bind onto a bare `<input>` with no need to repeat the type in JSX. A validator's `type` (e.g. `email()` setting `type: 'email'`) still wins for text fields.

`Form.error` mirrors the same tree; leaves are the per-validator-name error maps:

```tsx
{Form.error.email.required && <span>{Form.error.email.required}</span>}
{Form.error.address.zip.pattern && <span>Invalid ZIP</span>}
```

## Submit lifecycle

`<Form onSubmit>` is called by the rendered `<form>`'s submit event. The wrapper:

1. `preventDefault`s the event.
2. Marks every leaf `touched`.
3. Reads `form()` — if `valid: false`, **aborts** (your handler isn't called).
4. Sets `submitting: true` and calls your handler with the typed `values`.
5. If the handler returns a Promise, awaits it.
6. Sets `submitting: false` and `submitted: true`.

```tsx
<Form onSubmit={async (v) => {
  await api.signup(v);   // submitting is true while this runs
}}>
```

For the "show errors only after a field is touched" UX, gate the error display on `form().touched.<field>` — the wrapper marks every field touched on submit, so unsuccessful submits still highlight the failing fields.

## Reset

```ts
logic.form.reset();
```

Restores each field to its `initial` value and clears `touched` / `submitted` / `submitting`. Useful after a successful submit or for "cancel" buttons.

## What's not yet supported

- Field arrays (`addresses: [...]` — repeating subforms)
- Async validators (with a `validating` flag on the snapshot)
- Cross-field validators (`confirmPassword` matches `password`)
- File inputs
- Object-level validators (whole-tree Zod / class-validator) — use per-field validators for now; the lib's `oneOf`/`pattern` covers most schema-shaped checks.

## See also

- [Reactive state](./reactive-state) — `state`, `computedState`, the primitives `formState` sits on top of.
- [Dependency injection](./dependency-injection) — share a form across components by hoisting the form-owning class into a service.
