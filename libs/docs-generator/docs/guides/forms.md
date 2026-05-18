---
sidebar_position: 5
---

# Forms

Reactive forms backed by a logic class. `formState` defines the schema. `useForm` binds it to a React component with a typed `bind` proxy. Validators are named and per-field, and they can carry HTML attributes that get applied to the rendered inputs. Lives in `@react-logic/utils`.

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
    // typed values: `values.email`, `values.address.zip`, etc.
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

## How it fits together

Forms have three moving parts. Once you've seen them once, the rest of the guide is just filling in details.

**1. Define the form on your logic class.** Call `formState({...})` and assign it to a field. Each key is a field; pass any validators and options inline.

```ts
class SignupLogic {
  form = formState({
    email: { validators: [required(), email()] },
  });
}
```

**2. Bind it in the component.** `useForm(logic.form)` returns a `<Form>` component. Render the inputs through `Form.inputs.<field>` (the easiest path) or spread `Form.bind.<field>` onto your own elements.

```tsx
const Signup = () => {
  const logic = useLogic(SignupLogic);
  const Form = useForm(logic.form);
  return (
    <Form onSubmit={(values) => console.log(values)}>
      <Form.inputs.email />
      <button type="submit">Sign up</button>
    </Form>
  );
};
```

**3. Read the form when you need its state.** `logic.form` is a signal — calling it (`logic.form()`) returns the current snapshot, and the component subscribes to changes the same way it does for any other signal. Writes happen automatically through the `<Form>` bindings; you only read.

The snapshot is `{ values, errors, touched, dirty, valid, pristine, submitting, submitted }`. `values` is the typed value tree — read it directly to get the current field values:

```ts
const snap = logic.form();

snap.values.email;            // string — the current email input
snap.values.age;              // number, if you set `parse: Number`
snap.values.address.city;     // nested groups follow the schema shape
```

Use the other fields for UI flags — disable the submit button on `!snap.valid`, render an error when a field is touched and failing, branch on `submitting` / `submitted`:

```tsx
<button type="submit" disabled={!snap.valid}>Sign up</button>
{snap.touched.email && snap.errors.email.required && <p>Email is required</p>}
```

That's the loop: define on the logic class, bind in the component, read the snapshot. The rest of the guide is the details — what goes inside the schema, what validators ship with the library, and what the bind/error/inputs proxies expose.

## Schema

Each key in the schema is either a **field config** or a **group** (marked with `formGroup`). The shape nests as deep as you want.

```ts
type FieldConfig<T> = {
  initial?:    T;                                  // default depends on kind
  kind?:       'text' | 'checkbox' | 'select' | 'radio';
  parse?:      (raw: string) => T;                 // raw input → typed value
  validators?: ValidatorEntry<T>[];
};
```

Every property is optional. Empty `{}` is a `text` field with `''` as the initial value. `kind: 'checkbox'` defaults `initial` to `false`. Explicit `initial` always wins and narrows further:

```ts
country: { initial: 'US' as 'US' | 'UK', kind: 'select' }
```

`parse` runs on every raw-input write. Without it, the field's typed value is the raw string. For number inputs:

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

`formGroup` tells the schema "this is a nested group, not a field." Without it, `{ city: {} }` would be ambiguous (a field with a `city` config option? a group of one field?). The marker resolves that.

Empty groups are allowed. `formGroup({})` is a valid placeholder you can fill in later.

## Single-signal snapshot

`form()` returns one snapshot:

```ts
interface FormSnapshot<S> {
  values:     Values<S>;       // the parsed, typed value tree
  errors:     Errors<S>;       // tree of { [validatorName]: string | null }
  touched:    BoolTree<S>;     // booleans, same shape as the schema
  dirty:      BoolTree<S>;     // booleans, same shape as the schema
  valid:      boolean;         // every leaf has all-null errors
  pristine:   boolean;         // no field has been touched
  submitting: boolean;         // true between submit start and resolve
  submitted:  boolean;         // true after at least one successful submit
}
```

Reading `form()` from a logic-class field (via the `useLogic` tracking pass) subscribes the component to any change in any field. Most apps want the whole snapshot anyway (for `valid` and `submitting` on the submit button). When you don't, the bind proxies read individual fields without touching `form()`.

## Validators

Each entry has a required `name` (which becomes the error-map key), a `fn` predicate, and optional `message` and `htmlAttrs`.

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

Truthy means failed, falsy means valid:

```tsx
{Form.error.email.required && <p>Email is required</p>}
{Form.error.username.minLength && <p>{Form.error.username.minLength}</p>}
```

### Built-in validators

All come from `@react-logic/utils`. Each one sets a `name`, a default `message`, and where it makes sense the matching HTML attribute on the rendered input.

**Works on any field:**

- `required(message?)` — rejects empty values. Sets `required`.

**For string fields:**

- `minLength(n, message?)` — caps the lower bound. Sets `minLength`.
- `maxLength(n, message?)` — caps the upper bound. Sets `maxLength`.
- `pattern(regex, message?)` — matches against a regular expression. Sets `pattern` from `regex.source`.
- `email(message?)` — validates email format. Sets `type=email` and `inputMode=email`.
- `url(message?)` — validates URL format. Sets `type=url` and `inputMode=url`.

**For number fields** (use with `parse: Number`):

- `min(n, message?)` — numeric lower bound. Sets `min`.
- `max(n, message?)` — numeric upper bound. Sets `max`.
- `integer(message?)` — rejects non-integer values.

**Generic:**

- `oneOf(values, message?)` — accepts only values from the list. Useful for selects.
- `custom(name, fn, message?, htmlAttrs?)` — escape hatch. You supply the predicate, and optionally the HTML attrs.

Every factory takes an optional trailing `name` argument so you can give two of the same validator distinct keys in the error map (e.g. two `pattern(...)` rules on the same password field).

Combine freely. Multiple validators on the same field all run and report independently:

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

For one-offs without the helper, an inline object literal works too. The `formState<const S>` generic preserves the literal `name` automatically.

## HTML attrs flow through to bindings

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
- **Accessibility.** `required` is read by assistive tech.
- **Mobile keyboards.** `inputMode="email"` shows the email keyboard.
- **Semantic input types.** `type="email"` triggers built-in input parsing.

`<Form>` renders `<form noValidate>` by default. Your JS validators are the source of truth for error messages, so browsers won't show their own pop-ups. Override per-form with `<Form noValidate={false}>` to opt back into native validation.

## Rendering inputs — `Form.inputs`

`Form.inputs` is a tree of pre-built React components mirroring the schema. The easiest way to render a form: drop them straight into JSX.

```tsx
<Form.inputs.email placeholder="Email" />
<Form.inputs.username className="big" />
<Form.inputs.agree />
<Form.inputs.address.city placeholder="City" />
```

Each component:

- Renders `<select>` for `kind: 'select'`, `<input>` otherwise (checkbox/radio just set `type` via the bind).
- Wires the form props (value/checked/onChange/onBlur/name). These always win over any user-supplied prop with the same name.
- Forwards every other prop you pass: `placeholder`, `className`, `aria-*`, `id`, etc.
- Has a stable identity per field (cached by path), so React doesn't remount on every parent render.

For `<select>`, pass `<option>` children through:

```tsx
<Form.inputs.country>
  <option value="">Choose…</option>
  <option value="US">US</option>
  <option value="UK">UK</option>
</Form.inputs.country>
```

`Form.error` mirrors the same tree; leaves are the per-validator-name error maps:

```tsx
{Form.error.email.required && <span>{Form.error.email.required}</span>}
{Form.error.address.zip.pattern && <span>Invalid ZIP</span>}
```

## Rendering inputs — `Form.bind`

`Form.bind` is the lower-level API. Same tree as `Form.inputs`, but each leaf gives you the raw props instead of a component. Spread them into the element of your choice:

```tsx
<input {...Form.bind.email} />
<input {...Form.bind.address.zip} />
<input {...Form.bind.contact.primary.phone} />
```

When to reach for `bind` instead of `inputs`:

- **Custom or third-party components.** A styled component, a UI-library input (`<TextField />`, `<MuiInput />`), or your own wrapper — spread the bind onto whatever element you actually want.
- **A different element entirely.** `<textarea {...Form.bind.notes} />`, or a custom checkbox built from a `<button>`.
- **ESLint `react/jsx-pascal-case`.** That rule flags `<Form.inputs.email />` because field names are camelCase. Spreading `{...Form.bind.email}` into a plain `<input>` doesn't trigger it. Alternatively, disable the rule for the file (`rules: { 'react/jsx-pascal-case': 'off' }` — the `demos/forms` app does this) or inline-disable at the call site.
- **Personal preference.** Some teams like seeing the element in JSX every time.

The leaf props change shape based on `kind`:

- **text / select** → `{ name, value, onChange, onBlur, …htmlAttrs }`
- **checkbox** → `{ name, checked, onChange, onBlur, type: 'checkbox', …htmlAttrs }`
- **radio** → `{ name, value, onChange, onBlur, type: 'radio', …htmlAttrs }`

For checkbox and radio, the bind sets `type` automatically. Spread it onto a bare `<input>` and you don't need to repeat the type in JSX. A validator's `type` (e.g. `email()` setting `type: 'email'`) still wins for text fields.

`Form.inputs` and `Form.bind` are fully interchangeable. You can mix them in the same form — use the shorthand where it's convenient, drop to bind where you need control.

## Submit lifecycle

`<Form onSubmit>` is called by the rendered `<form>`'s submit event. The wrapper:

1. Calls `preventDefault` on the event.
2. Marks every leaf `touched`.
3. Reads `form()`. If `valid: false`, **aborts** and your handler isn't called.
4. Sets `submitting: true` and calls your handler with the typed `values`.
5. If the handler returns a Promise, awaits it.
6. Sets `submitting: false` and `submitted: true`.

```tsx
<Form onSubmit={async (v) => {
  await api.signup(v);   // submitting is true while this runs
}}>
```

For the "show errors only after a field is touched" UX, gate the error display on `form().touched.<field>`. The wrapper marks every field touched on submit, so unsuccessful submits still highlight the failing fields.

## Reset

```ts
logic.form.reset();
```

Restores each field to its `initial` value and clears `touched`, `submitted`, and `submitting`. Useful after a successful submit or for "cancel" buttons.

## What's not yet supported

- Field arrays (`addresses: [...]` — repeating subforms)
- Async validators (with a `validating` flag on the snapshot)
- Cross-field validators (`confirmPassword` matches `password`)
- File inputs
- Object-level validators (whole-tree Zod / class-validator). Use per-field validators for now. The lib's `oneOf` and `pattern` cover most schema-shaped checks.

## See also

- [Reactive state](./reactive-state) — `state` and `computedState`, the building blocks `formState` is built on.
- [Dependency injection](./dependency-injection) — share a form across components by moving the form-owning class into a service.
