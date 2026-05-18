---
sidebar_position: 3
---

# Dependency injection adapters

The DI runtime is **pluggable**. The framework defines a contract called the *DI adapter*. The rest of the library only talks to that contract, never to a specific implementation.

That means you can replace the default DI runtime with another one. The first alternative is `@react-logic/angular-adapter`, which backs react-logic with Angular's `EnvironmentInjector` so you can share Angular services.

## The contract

The full shape lives at [DIAdapter](/docs/api/di/interfaces/DIAdapter). Six operations:

- `createScope(providers, parent)` — build a child scope.
- `disposeScope(scope)` — tear it down.
- `runIn(scope, fn)` — set the active scope while `fn` runs.
- `construct(scope, fn)` — same as `runIn`, plus collect `onDestroy` callbacks and track which services were injected (used by `useLogic`).
- `inject(token, optional?)` — resolve a token through the active scope.
- `onDestroy(fn)` — register cleanup tied to whatever's currently being constructed.

Plus a `rootScope` property: the top-level scope used when no `<Injector>` wraps the React tree.

## The default adapter

The default adapter is registered automatically when you import `@react-logic/di`. It's a small purpose-built DI implementation with parent-delegating scopes, instance caching, lifecycle hooks, and hierarchical resolution. Most apps never need to think about it.

```ts
import '@react-logic/di';        // registers the default adapter as a side effect
```

## Swapping adapters

Call `setDIAdapter(adapter)` once, *before* mounting React. Calling it later won't migrate instances that are already constructed.

```ts
import { setDIAdapter } from '@react-logic/react-logic';
import { createAngularAdapter } from '@react-logic/angular-adapter';
import { createEnvironmentInjector, Injector } from '@angular/core';

const root = createEnvironmentInjector([], Injector.NULL as never);
setDIAdapter(createAngularAdapter(root));

// …then mount React.
```

After the swap, `inject()`, `<Injector>`, `useLogic`, and `onDestroy` all delegate to the Angular adapter. Logic classes don't change. The imports they use are the same.

## What's portable

Code that only touches `inject`, `onDestroy`, and `<Injector>` from `@react-logic/di` runs unchanged on either adapter. The adapter swap is invisible to logic classes.

What's *not* portable:

- Adapter-specific provider shapes. Angular's full provider system has flags like `multi: true` and `factory` with a deps array that the default adapter doesn't model. If you use those, you're tied to Angular.
- Adapter-specific lifecycle. Angular's `DestroyRef` cascades along its injector tree. The default adapter has its own model. The framework's `onDestroy` hides the difference for the common case.
- Custom typedoc options or build settings tied to one adapter's runtime.

## Writing your own adapter

Any DI runtime that supports a scope tree, parent delegation, cached instances, and lifecycle hooks can host react-logic. The pattern:

1. Pick a scope type (your library's "injector" or equivalent).
2. Implement the six operations and `rootScope`.
3. For `construct`, create a short-lived destroy context. It needs to track user-level `onDestroy` calls separately from service-internal ones, and to track every value `inject()` returns.
4. Pass the assembled object to `setDIAdapter`.

See [angular-adapter.ts](https://github.com/react-logic/react-logic/blob/main/libs/angular-adapter/src/lib/angular-adapter.ts) for a working ~70-line reference implementation.

## Why an adapter at all?

Two reasons:

1. **Interop.** Some teams have existing Angular (or other-framework) services they want to share with React. The adapter is the bridge.
2. **Replaceability.** The default adapter is small but opinionated. If you want stricter behavior — no class auto-registration, multi-providers, or destroy semantics that match your test framework — an adapter lets you swap it without forking the library.

If you don't need either, you'll never touch this layer.
