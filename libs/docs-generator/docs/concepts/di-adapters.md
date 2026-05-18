---
sidebar_position: 3
---

# DI Adapters

The DI runtime is **pluggable**. The framework defines a contract, the *DI adapter*, and the rest of the lib only talks to that contract — never to a concrete implementation.

This means you can replace the default DI runtime with another one. The first alternate ships as `@react-logic/angular-adapter`, which backs react-logic with Angular's `EnvironmentInjector` so you can interop with existing Angular services.

## The contract

The full shape lives at [DIAdapter](/docs/api/di/interfaces/DIAdapter). Six operations:

- `createScope(providers, parent)` — build a child scope.
- `disposeScope(scope)` — tear it down.
- `runIn(scope, fn)` — set the active scope while `fn` runs.
- `construct(scope, fn)` — same as `runIn`, plus capture `onDestroy` callbacks and track which services were injected (used by `useLogic`).
- `inject(token, optional?)` — resolve a token through the active scope.
- `onDestroy(fn)` — register cleanup tied to the currently-constructing entity.

Plus a `rootScope` property — the implicit top-of-tree scope, used when no `<Injector>` wraps the React tree.

## The default adapter

The default adapter is registered automatically when you import `@react-logic/di`. It's a small purpose-built DI implementation: parent-delegating scopes, instance caching, destroy-sink lifecycle, hierarchical resolution. Most apps never need to think about it.

```ts
import '@react-logic/di';        // default adapter is registered as a side effect
```

## Swapping adapters

Call `setDIAdapter(adapter)` once, *before* mounting React. Calling it later won't migrate already-constructed instances.

```ts
import { setDIAdapter } from '@react-logic/react-logic';
import { createAngularAdapter } from '@react-logic/angular-adapter';
import { createEnvironmentInjector, Injector } from '@angular/core';

const root = createEnvironmentInjector([], Injector.NULL as never);
setDIAdapter(createAngularAdapter(root));

// …then mount React.
```

After the swap, `inject()`, `<Injector>`, `useLogic`, and `onDestroy` all delegate to the Angular adapter. Logic classes don't change — the imports they use are the same.

## What's portable

User code that only touches `inject` / `onDestroy` / `<Injector>` from `@react-logic/di` runs unchanged on either adapter. The adapter swap is invisible at the logic-class level.

What's *not* portable:

- Adapter-specific provider shapes. Angular's full provider system has flags (`multi: true`, `factory: () => ...` with deps array) that the default adapter doesn't model. If you use those, you're tied to Angular.
- Adapter-specific lifecycle. Angular's `DestroyRef` cascades along its injector tree; the default adapter has its own model. The framework's `onDestroy` papers over the difference for the common case.
- Custom typedoc options or build settings tied to one adapter's runtime.

## Writing your own adapter

Any DI runtime that can model "scope tree + parent delegation + cached instances + lifecycle hooks" can host react-logic. The pattern:

1. Pick a scope type (your library's "injector" or equivalent).
2. Implement the six operations + `rootScope`.
3. For `construct`, create a transient destroy context that tracks user-level `onDestroy` calls separately from service-internal ones, and tracks every value `inject()` returns.
4. Hand the framework the assembled object via `setDIAdapter`.

Look at [angular-adapter.ts](https://github.com/react-logic/react-logic/blob/main/libs/angular-adapter/src/lib/angular-adapter.ts) for a working ~70-line reference implementation.

## Why an adapter at all?

Two reasons:

1. **Interop.** Some teams have existing Angular (or other-framework) services they want to share with React-rendered logic. The adapter is the seam.
2. **Replaceability.** The default adapter is small but opinionated. If you want stricter behavior (no class auto-registration, multi-providers, hierarchical destroy semantics that mirror your test framework), an adapter lets you swap it without forking the lib.

If neither of those is a need, you'll never touch this layer.
