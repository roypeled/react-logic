import {
  createEnvironmentInjector,
  DestroyRef,
  EnvironmentInjector,
  inject as ngInject,
  runInInjectionContext,
  type Provider as AngularProvider,
} from '@angular/core';
import type { DIAdapter, InjectionType } from '@react-logic/di';

/**
 * Build a `DIAdapter` backed by Angular's DI.
 *
 * Pass an `EnvironmentInjector` to act as the root scope. Typically this is
 * the `EnvironmentInjector` from your Angular bootstrap, or a standalone one
 * created with `createEnvironmentInjector(providers, ɵNullInjector)` if you
 * want a React-only app that borrows Angular DI.
 *
 * @category Adapter
 * @example
 * ```ts
 * import { createEnvironmentInjector } from '@angular/core';
 * import { setDIAdapter } from '@react-logic/di';
 * import { createAngularAdapter } from '@react-logic/angular-adapter';
 *
 * const root = createEnvironmentInjector([], parentInjector);
 * setDIAdapter(createAngularAdapter(root));
 * ```
 */
export const createAngularAdapter = (
  rootInjector: EnvironmentInjector
): DIAdapter<EnvironmentInjector> => {
  let collecting: unknown[] | null = null;

  const adapterInject = <T>(token: InjectionType<T>, optional?: boolean): T | null => {
    const result = (optional
      ? ngInject(token as never, { optional: true })
      : ngInject(token as never)) as T | null;
    if (collecting && result !== null && result !== undefined) collecting.push(result);
    return result;
  };

  const adapter: DIAdapter<EnvironmentInjector> = {
    rootScope: rootInjector,

    createScope(providers, parent) {
      // The Provider shape from @react-logic/di matches Angular's provider shape
      // for value/class/factory cases, so cast through directly.
      return createEnvironmentInjector(
        providers as unknown as AngularProvider[],
        parent
      );
    },

    disposeScope(scope) {
      scope.destroy();
    },

    runIn(scope, fn) {
      return runInInjectionContext(scope, fn);
    },

    construct(scope, fn) {
      // A transient child injector hosts the DestroyRef for the constructed
      // entity (typically a logic class). When we destroy the child injector,
      // every onDestroy callback registered during construction fires —
      // without affecting the parent scope or its services.
      const transient = createEnvironmentInjector([], scope);
      const injected: unknown[] = [];
      const prev = collecting;
      collecting = injected;
      try {
        const result = runInInjectionContext(transient, fn);
        return {
          result,
          injected,
          dispose: () => transient.destroy(),
        };
      } finally {
        collecting = prev;
      }
    },

    inject: adapterInject as DIAdapter<EnvironmentInjector>['inject'],

    onDestroy(fn) {
      ngInject(DestroyRef).onDestroy(fn);
    },
  };

  return adapter;
};

// Re-export Provider type for convenience so callers don't need a second import.
export type { Provider } from '@react-logic/di';
