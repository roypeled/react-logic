---
sidebar_position: 1
slug: /guides
---

# Guides

Deep-dive explanations of each piece of the library. Each guide covers a single subsystem in depth, with worked examples and the reasoning behind the API shape. Read these once when you start; come back when you hit an edge case.

If you're looking for "how do I do X" code-first answers, see [Recipes](/docs/recipes). If you want the high-level mental model first, see [Concepts](/docs/concepts).

- [Reactive state](/docs/guides/reactive-state) — `state`, `computedState`, `effect`. The signal mechanics.
- [Async state](/docs/guides/async-state) — `asyncState`. Reactive async producers.
- [Fetch state](/docs/guides/fetch-state) — `fetchState`, `callableFetchState`. HTTP with cancellation, status, pluggable transport.
- [Forms](/docs/guides/forms) — `formState`, `useForm`, named validators. Schema-driven forms backed by a logic class.
- [Batch operations](/docs/guides/batch-operations) — `batch`, `startBatch` / `endBatch`. Coalescing writes.
- [Dependency injection](/docs/guides/dependency-injection) — `inject`, `Injector`, providers, scoping, `onDestroy`.
- [Testing](/docs/guides/testing) — fakes, scope isolation, async flush helpers.
