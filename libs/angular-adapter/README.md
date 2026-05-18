# @react-logic/angular-adapter

Use [`@react-logic/di`](https://npmjs.com/package/@react-logic/di) backed by Angular's `EnvironmentInjector`. Lets a React app share DI with an Angular host (hybrid app, micro-frontend) — or run on Angular DI alone.

Part of [react-logic](https://github.com/roy-peled_sfrt/react-logic).

## Install

```sh
npm install @react-logic/angular-adapter
```

Peer dependencies: `@angular/core@^18 || ^19`, `@react-logic/di@^0.1.0`, `react@^18 || ^19`.

## Usage

```ts
import { createEnvironmentInjector } from '@angular/core';
import { setDIAdapter } from '@react-logic/di';
import { createAngularAdapter } from '@react-logic/angular-adapter';

// At app bootstrap — swap the default DI adapter for Angular's.
const root = createEnvironmentInjector([], parentInjector);
setDIAdapter(createAngularAdapter(root));
```

Once installed, all `inject(...)`, `Injector` scopes, and `onDestroy` calls from `@react-logic/di` route through Angular's DI graph. Providers registered in the Angular host become resolvable from React logic classes and vice versa.

See the [project README](https://github.com/roy-peled_sfrt/react-logic#readme) for full docs.

## License

MIT
