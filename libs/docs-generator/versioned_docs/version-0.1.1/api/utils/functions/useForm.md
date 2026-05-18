# Function: useForm()

<div class="api-package">Imported from <code>@react-logic/utils</code></div>


<div class="api-signature">

> **useForm**\<`S`\>(`handle`): [`FormComponent`](../type-aliases/FormComponent.md)\<`S`\>

</div>

<div class="api-sources">

Defined in: [utils/src/lib/use-form.tsx:292](https://github.com/roypeled/react-logic/blob/5314044ec2c9ab319e0db2c3693b274d96dbd217/libs/utils/src/lib/use-form.tsx#L292)

</div>

Bind a `FormHandle` to a React component. Returns a `<Form>` component
whose `bind` and `error` properties are proxies mirroring the schema —
spread `Form.bind.email` into an `<input>`, read `Form.error.email` to
branch on per-validator failures.

```tsx
const Signup = () => {
  const logic = useLogic(SignupLogic);
  const Form = useForm(logic.form);
  return (
    <Form onSubmit={(values) => logic.submit(values)}>
      <input {...Form.bind.email} />
      {Form.error.email.required && <p>Email is required</p>}
      <input {...Form.bind.address.city} />
      <button type="submit" disabled={!logic.form().valid}>Sign up</button>
    </Form>
  );
};
```

## Type Parameters

### S

`S` *extends* [`Schema`](../type-aliases/Schema.md)

The schema (inferred from `handle`).

## Parameters

<div class="api-parameters">

### handle

[`FormHandle`](../interfaces/FormHandle.md)\<`S`\>

</div>

## Returns

[`FormComponent`](../type-aliases/FormComponent.md)\<`S`\>
