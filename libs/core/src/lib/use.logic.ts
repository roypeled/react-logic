import { useEffect, useMemo, useState } from 'react';
import { effect, effectScope, isComputed, isSignal, signal } from 'alien-signals';
import { getDIAdapter, useCurrentScope } from '@react-logic/di';

let instanceTracker = 0;

/**
 * Symbol attached by `useLogic` to every constructed logic instance, holding
 * a monotonic per-process id. Useful for correlating debug logs across the
 * lifetime of an instance (constructor, signal updates, cleanup) since the
 * class itself doesn't otherwise carry an identity for the same render.
 *
 * Treat as read-only. Not part of stable user API; exposed for debugging.
 *
 * @category Internal
 */
export const INSTANCE_ID_SYMBOL = Symbol('InstanceId');

/**
 * Constructor signature accepted by `useLogic`.
 *
 * Logic classes are constructed by the framework with no arguments — any
 * dependencies are pulled in via `inject()` calls inside the constructor or
 * field initializers. The variadic parameter type is for TypeScript variance
 * convenience, not because positional arguments are supported.
 *
 * @typeParam T - The instance type the logic class produces. Constrained to
 *   `object` so primitive returns aren't accepted.
 * @category Types
 */
export type LogicClass<T extends object> = new (...args: any[]) => T;

type Signal<T = unknown> = typeof signal<T>;

type LogicInstance<T extends object> = T & { [INSTANCE_ID_SYMBOL]: number };

const isFunctionForSignal = (value: any): boolean => {
  if (typeof value !== 'function') return false;
  return isSignal(value) || isComputed(value);
};

const createLogicInstance = <T extends object>(
  logicClass: LogicClass<T>,
  scope: unknown,
  effectHandler: (i: LogicInstance<T>) => void
) => {
  const instanceId = instanceTracker++;
  console.debug(`Creating logic instance for ${logicClass.name}@${instanceId}`);

  const runSignalsInInstance = (obj: any) => {
    const allKeys = Object.keys(obj);
    allKeys.forEach((key) => {
      const value = obj[key];
      if (isFunctionForSignal(value)) {
        (obj[key] as Signal)();
      }
    });
  };

  let instance!: LogicInstance<T>;
  let injectedInstances: unknown[] = [];
  let disposeUserDestroys: () => void = () => undefined;

  // The effectScope wraps both the constructor and the tracking effect so any
  // `effect()` the user creates in the constructor is captured and disposed
  // together with everything else when the logic instance is torn down.
  const cleanupSignals = effectScope(() => {
    const adapter = getDIAdapter();
    const built = adapter.construct(scope, () => new logicClass() as LogicInstance<T>);

    instance = built.result;
    instance[INSTANCE_ID_SYMBOL] = instanceId;
    injectedInstances = built.injected;
    disposeUserDestroys = built.dispose;

    effect(() => {
      injectedInstances.forEach((i) => runSignalsInInstance(i));
      runSignalsInInstance(instance);
      // Run the effect handler in a separate tick to ensure all signals are updated, but not in the same effect cycle
      setTimeout(() => effectHandler(instance));
    });
  });

  return { rootInstance: instance, cleanupSignals, disposeUserDestroys, instanceId };
};

/**
 * A React hook to use a logic class with dependency injection and state management.
 *
 * @typeParam T - The logic-class instance type. Inferred from `logicClass`.
 * @category Hooks
 * @param logicClass - The logic class to instantiate and manage.
 * @param cleanup - An optional cleanup function to run when the component unmounts, receiving the logic instance.
 * @returns The instance of the logic class.
 * @example
 * ```tsx
 * class MyLogic {
 *   count = state(0);
 *   increment() {
 *     this.count(this.count() + 1);
 *   }
 * }
 * const MyComponent = () => {
 *   const logic = useLogic(MyLogic);
 *   return (
 *     <div>
 *       <p>Count: {logic.count()}</p>
 *       <button onClick={() => logic.increment()}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useLogic = <T extends object>(
  logicClass: LogicClass<T>,
  cleanup?: (instance: LogicInstance<T>) => void
) => {
  const scope = useCurrentScope();
  const [stateInstance, setStateInstance] = useState<{ i: LogicInstance<T> } | undefined>();

  const { rootInstance, cleanupSignals, disposeUserDestroys, instanceId } = useMemo(() => {
    return createLogicInstance(logicClass, scope, (i) => {
      setStateInstance({ i });
    });
  }, [logicClass, scope]);

  useEffect(() => {
    return () => {
      console.debug(`Cleaning up logic instance for ${logicClass.name}@${instanceId}`);
      cleanupSignals();
      disposeUserDestroys();
      if (cleanup) {
        cleanup(rootInstance);
      }
    };
  }, [cleanup, cleanupSignals, disposeUserDestroys, rootInstance, instanceId, logicClass]);

  return stateInstance?.i ?? rootInstance;
};
