# @react-logic/di

Lightweight dependency injection for React — `Injector`, `inject`, `InjectionToken`, `onDestroy`.

Part of [react-logic](https://github.com/roy-peled_sfrt/react-logic). For the full toolkit in one install, use [`@react-logic/react-logic`](https://npmjs.com/package/@react-logic/react-logic).

## Install

```sh
npm install @react-logic/di
```

Peer dependency: `react@^18 || ^19`.

## Usage

```tsx
import { Injector, inject } from '@react-logic/di';

class ApiService {
  fetchUsers() { return fetch('/users').then(r => r.json()); }
}

class UsersLogic {
  api = inject(ApiService);
  load() { return this.api.fetchUsers(); }
}

export function App() {
  return (
    <Injector providers={[ApiService]}>
      <UsersList />
    </Injector>
  );
}
```

- Auto-resolves class providers without manual registration.
- Override with `{ provide: Token, useClass: ... }` / `useValue` / `useFactory`.
- `onDestroy(fn)` registers cleanup tied to the surrounding `Injector` (or logic instance).

See the [project README](https://github.com/roy-peled_sfrt/react-logic#readme) for full docs and demos.

## License

MIT
