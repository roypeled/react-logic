# React Logic

A tiny React toolkit that cleanly separates component render from component logic using signals and dependency injection (DI).

- One logic instance per component (no re-renders in the logic itself)
- Signals drive UI updates with minimal React glue
- Simple DI to share services across your app

This repo contains the following publishable packages:

**Required**
- `@react-logic/core` — `useLogic` hook to bind a logic class to a component
- `@react-logic/state` — signal utilities (`state`, `computedState`, `effect`)
- `@react-logic/di` — lightweight dependency injection (`Provider`, `inject`, tokens)

**Umbrella**
- `@react-logic/react-logic` — re-exports the three required packages; install this to pull all three in one shot

**Optional**
- `@react-logic/utils` — extra state helpers (`asyncState`, `fetchState`)
- `@react-logic/angular-adapter` — DI adapter for Angular hosts

## Why

React components mix rendering with business logic. This project lets you:
- Define logic in plain classes (no React APIs inside)
- Use signals for state and derived values
- Bind logic to the component via `useLogic` so React re-renders when signals change

Your logic stays testable and framework-free, while React focuses on rendering.

## Install

Use any package manager; examples below use npm.

```sh
npm install @react-logic/react-logic
```

Add optionals as needed:

```sh
npm install @react-logic/utils             # asyncState, fetchState
npm install @react-logic/angular-adapter   # Angular DI bridge
```

## Quick start

Start with a simple logic class and a React component:

```tsx
import { useLogic, state, computedState } from '@react-logic/react-logic';

class CounterLogic {
  count = state(0);
  doubled = computedState(() => this.count() * 2);

  inc() { this.count(this.count() + 1); }
  dec() { this.count(this.count() - 1); }
}

export default function Counter() {
  const logic = useLogic(CounterLogic);

  return (
    <div>
      <p>Count: {logic.count()}</p>
      <p>Doubled: {logic.doubled()}</p>
      <button onClick={() => logic.dec()}>-</button>
      <button onClick={() => logic.inc()}>+</button>
    </div>
  );
}
```

Key ideas:
- Logic classes hold signals; read with `signal()`, write with `signal(next)`.
- `useLogic(CounterLogic)` returns a single instance for the component and re-renders when signals used during render change.

## API reference (short)

### @react-logic/state
- `state<T>(initial: T)` — create a signal function `s() / s(next)`.
- `computedState<T>(fn: () => T)` — derived signal from other signals.
- `computedState<I, T>(fn: (input: I) => T)` — input variant; the returned function doubles as a setter. Use a default arg (`(q = '') => …`) to narrow the input from `I | undefined` to `I`.
- `effect(fn)` — reactive effect; optionally returns a cleanup.
- `batch(fn)` — coalesce multiple signal writes into a single notification pass. Subscribers (effects, `useLogic` re-renders) fire once at the end instead of per-write. `startBatch()` / `endBatch()` exposed for advanced control-flow cases.

### @react-logic/core
- `useLogic<T>(LogicClass: new () => T, cleanup?: (instance: T) => void): T` — bind a logic class to a component.

### @react-logic/utils
- `asyncState<T>(fn: () => Promise<T>)` — async-seeded signal that re-runs when its tracked dependencies change.
- `fetchState(buildFn, config?)` — reactive HTTP fetch (GET by default). Built-in `AbortController`, discriminated loading/result/error state including `status`, body auto-stringify, pluggable transport adapter. Read with `()`, fire/refetch with `.fetch(args?)`.
- `fetchState.callable(buildFn, config?)` — imperative companion. Same state shape and accessor surface; build callback only runs when `.fetch(...)` is called.
- `postFetchState`, `putFetchState`, `deleteFetchState` — verb-preset wrappers over `fetchState`. Same shape (reactive default + `.callable` companion), method baked in. Per-call descriptor still overrides.
- `setFetchStateAdapter(adapter)` / `createAxiosFetchAdapter(axios)` — swap the global HTTP transport (e.g. route every reactive fetch through an axios instance with interceptors).
- `formState(schema)` / `formGroup(schema)` — schema-driven forms with a single-signal snapshot, recursive nesting, named per-field validators, and HTML-attr-aware built-ins (`required`, `minLength`, `email`, `pattern`, …).
- `useForm(handle)` — React hook returning a `<Form>` component with typed `bind` / `error` proxies (`<input {...Form.bind.address.city} />`, `Form.error.email.required`).

## Demos

One runnable app per feature under `demos/`. Each is a standalone Vite app that exercises one piece of the library end-to-end:

| App | Feature |
|---|---|
| `demos/reactive-state` | `state` / `computedState` / `effect` / `onDestroy` |
| `demos/async-state`    | `asyncState` |
| `demos/fetch-state`    | `fetchState` + `postFetchState.callable` |
| `demos/forms`          | `formState` + validators + `useForm` |
| `demos/di`             | `<Injector>` scoping a shared service |
| `demos/batching`       | `batch` vs. naive multi-write |

Run any of them:

```sh
npm install
npx nx serve demo-reactive-state
```

The corresponding **explanation page** lives at `/docs/demos/<name>` in the docs site.

## Docs site

The documentation site is a Docusaurus app under `libs/docs-generator`.

```sh
npm install
npx nx serve docs-generator        # local dev server on :3000
npx nx build docs-generator        # static build into <repo>/docs
```

On `push` to `main` the [`deploy-docs` workflow](_media/deploy-docs.yml) builds and publishes the site to GitHub Pages.

## License

MIT
