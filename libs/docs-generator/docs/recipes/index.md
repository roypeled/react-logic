---
sidebar_position: 0
slug: /recipes
---

# Recipes

Practical patterns for things you'll do often. Each recipe is a self-contained walkthrough — copy the code, adapt to your domain, move on.

## Index

- [Form input bound to state](./form-input.md) — two-way binding via signal getters/setters; validation as a computed.
- [Async data that re-fetches on a key change](./async-data.md) — `asyncState` with reactive dependencies; loading/error patterns.
- [Persistent state across hide/show](./persistent-state.md) — surviving component unmounts by lifting to a service.
- [Sharing services scoped to a tree](./scoped-services.md) — one service across multiple components; tree-bounded lifetime.
- [Replacing services in tests](./testing-mocks.md) — provide fakes through `<Injector>` without touching production code.
- [Side effects driven by signals](./signal-effects.md) — `effect()` inside constructors; auto-tracked cleanup.
- [Cleanup for non-signal resources](./cleanup.md) — `onDestroy` for intervals, listeners, sockets.
- [Provider override for a sub-tree](./provider-override.md) — nested `<Injector>` for theming or feature flags.

If you can't find what you're looking for, the [Concepts](/docs/concepts) section covers the underlying model.
