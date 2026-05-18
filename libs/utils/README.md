# @react-logic/utils

Optional helpers built on top of [`@react-logic/state`](https://npmjs.com/package/@react-logic/state) and [`@react-logic/di`](https://npmjs.com/package/@react-logic/di):

- `asyncState` — async-seeded signals that re-run on dependency change.
- `fetchState` + verb presets (`postFetchState`, `putFetchState`, `deleteFetchState`) — reactive HTTP with built-in abort, status, and pluggable transport.
- `formState` / `formGroup` / `useForm` — schema-driven forms with typed `bind` / `error` proxies and HTML-attr-aware validators.

Part of [react-logic](https://github.com/roypeled/react-logic).

## Install

```sh
npm install @react-logic/utils
```

Peer dependency: `react@^18 || ^19`. Pulls in `@react-logic/state` and `@react-logic/di` transitively.

## Usage

```ts
import { fetchState, asyncState } from '@react-logic/utils';
import { state } from '@react-logic/state';

class UsersLogic {
  query = state('');
  users = fetchState(() => `/api/users?q=${this.query()}`);
  // users() => { loading, data, error, status }

  refetch() { this.users.fetch(); }
}
```

```tsx
import { useForm, formState } from '@react-logic/utils';

class LoginLogic {
  form = formState({
    email: { value: '', validators: { required: true, email: true } },
    password: { value: '', validators: { required: true, minLength: 8 } },
  });
}

export function LoginForm() {
  const logic = useLogic(LoginLogic);
  const Form = useForm(logic.form);
  return (
    <Form>
      <input {...Form.bind.email} />
      {Form.error.email.required && <p>Email is required</p>}
    </Form>
  );
}
```

See the [project README](https://github.com/roypeled/react-logic#readme) for full docs and demos.

## License

MIT
