---
sidebar_position: 1
---

# Demos

Each demo is a standalone runnable app under `demos/<name>/` that exercises one feature end-to-end. The pages below explain what each demo does and link to the source; clone the repo to run them locally.

```sh
nx serve demo-reactive-state
```

The same shape works for every demo — replace the project name.

## Index

- [Reactive state](/docs/demos/reactive-state) — `state` / `computedState` / `effect` / `onDestroy` in a counter with persistence.
- [Async state](/docs/demos/async-state) — `asyncState` re-fetching on a key change.
- [Fetch state](/docs/demos/fetch-state) — reactive search + imperative mutation + verb helpers.
- [Forms](/docs/demos/forms) — `formState` with validators, nested groups, all input kinds.
- [Dependency injection](/docs/demos/dependency-injection) — `<Injector>` scoping a shared service.
- [Batching](/docs/demos/batching) — `batch` collapsing multiple writes into one notification.
