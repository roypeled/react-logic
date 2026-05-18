---
sidebar_position: 1
slug: /guides
---

# Guides

Detailed explanations of each part of the library. Each guide covers one piece in depth, with examples and the reasoning behind the API. Read these once when you start. Come back when you hit an edge case.

If you want "how do I do X" code-first answers, see [Recipes](/docs/recipes). If you want the high-level mental model first, see [Concepts](/docs/concepts).

- [Reactive state](/docs/guides/reactive-state) — `state`, `computedState`, `effect`. How signals work.
- [Async state](/docs/guides/async-state) — `asyncState`. Reactive async values.
- [Fetch state](/docs/guides/fetch-state) — `fetchState`, `callableFetchState`. HTTP with cancellation, status, and a pluggable transport.
- [Forms](/docs/guides/forms) — `formState`, `useForm`, named validators. Schema-driven forms backed by a logic class.
- [Batch operations](/docs/guides/batch-operations) — `batch`, `startBatch` / `endBatch`. Combining writes.
- [Dependency injection](/docs/guides/dependency-injection) — `inject`, `Injector`, providers, scoping, `onDestroy`.
- [Testing](/docs/guides/testing) — fakes, scope isolation, async flush helpers.
