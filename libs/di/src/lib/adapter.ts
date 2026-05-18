import { InjectionType, Provider } from './types';

/**
 * The shape every DI adapter must implement. The framework uses this and
 * never reaches into adapter internals — this is what swaps in/out when you
 * choose between the built-in DI, Angular's, or any other.
 *
 * `Scope` is the adapter-private handle representing one DI scope (a node in
 * the parent/child injector tree). The framework treats it as opaque.
 *
 * @typeParam Scope - The adapter's internal scope handle type. Default is
 *   `unknown` because consumers (the framework) never inspect it.
 * @category Adapter
 */
export interface DIAdapter<Scope = unknown> {
  /** The implicit top-of-tree scope — used when no `<Injector>` wraps a tree. */
  readonly rootScope: Scope;

  /** Create a child scope of `parent` that adds `providers`. */
  createScope(providers: Provider[], parent: Scope): Scope;

  /**
   * Tear down a scope: dispose every service it constructed locally and run
   * their `onDestroy` callbacks. Parent scopes are untouched.
   */
  disposeScope(scope: Scope): void;

  /**
   * Run `fn` with `scope` as the active injection context — `inject()` calls
   * inside `fn` resolve through this scope. Used by `useInjector` and for
   * one-off resolutions.
   *
   * @typeParam T - The return type of `fn`.
   */
  runIn<T>(scope: Scope, fn: () => T): T;

  /**
   * Run a constructor (e.g. a logic class) inside `scope` with full tracking:
   * - `inject()` calls resolve through `scope` (and ancestors).
   * - `onDestroy()` calls inside `fn` are captured into the returned `dispose`.
   *   Service-internal `onDestroy` calls go to the service's own scope —
   *   they are *not* in this dispose.
   * - Records every value returned by `inject()` during `fn` for the caller
   *   (used by `useLogic` to subscribe to injected services' signals).
   *
   * @typeParam T - The type returned by `fn` (typically the constructed instance).
   */
  construct<T>(scope: Scope, fn: () => T): {
    result: T;
    dispose: () => void;
    injected: unknown[];
  };

  /**
   * Resolve a token through the currently-active scope (set by `runIn`/`construct`).
   *
   * @typeParam T - The type the token resolves to.
   */
  inject<T>(token: InjectionType<T>, optional?: boolean): T | null;

  /** Register a teardown for the currently-constructing entity. */
  onDestroy(fn: () => void): void;
}

let active: DIAdapter | undefined;

/**
 * Install the DI adapter for the application. Call once before mounting React.
 *
 * The default adapter (alien-signals + the built-in DI) registers itself
 * automatically when `@react-logic/di` is imported, so most apps never call
 * this. You only need it when you're swapping in a different adapter — e.g.
 * `createAngularAdapter(...)` from `@react-logic/angular-adapter` to back
 * react-logic with Angular's DI.
 *
 * Calling this *after* logic classes have already been instantiated will
 * leave those instances bound to the previous adapter — register early.
 *
 * @category Adapter
 * @example
 * ```ts
 * import { setDIAdapter } from '@react-logic/di';
 * import { createAngularAdapter } from '@react-logic/angular-adapter';
 *
 * setDIAdapter(createAngularAdapter(angularRootInjector));
 * // …then mount React.
 * ```
 */
export const setDIAdapter = (adapter: DIAdapter): void => {
  active = adapter;
};

/**
 * Returns the currently-installed DI adapter. Throws if none is registered
 * (which only happens if the entry file never imported `@react-logic/di` —
 * the import side-effect registers the default adapter).
 *
 * Most user code shouldn't need this. It's exposed for adapter implementers,
 * tooling, and the framework's own internals (`useLogic`, `<Injector>`, etc.).
 *
 * @category Adapter
 */
export const getDIAdapter = (): DIAdapter => {
  if (!active) {
    throw new Error(
      '@react-logic: no DI adapter is registered. Import @react-logic/di for the default, or call setDIAdapter() with a custom adapter before rendering.'
    );
  }
  return active;
};
