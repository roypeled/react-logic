import { useContext, useEffect, useMemo, useState } from 'react';
import { effect, effectScope, isComputed, isSignal, signal } from 'alien-signals';
import {
  collectInjectedInstances,
  getGlobalContext,
  InjectionContext,
  popDestroySink,
  pushDestroySink,
  runDestroySink,
  setInjectionLifecycleContext
} from '@react-logic/di';

let instanceTracker = 0;

export const INSTANCE_ID_SYMBOL = Symbol('InstanceId');

/**
 * Type representing a class constructor for a logic class.
 */
export type LogicClass<T extends object> = new (...args: any[]) => T;

type Signal<T = unknown> = typeof signal<T>

type LogicInstance<T extends object> = T & { [INSTANCE_ID_SYMBOL]: number };

const isFunctionForSignal = (value: any): boolean => {
  if (typeof value !== 'function') return false;
  return isSignal(value) || isComputed(value);
};

const createLogicInstance = <T extends object>(logicClass: LogicClass<T>, effectHandler: (i: LogicInstance<T>) => void) => {
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

  // Sink captures `onDestroy` callbacks registered during the logic class
  // constructor (and field initializers). Service-construction `onDestroy`
  // calls land in the DI context's per-service sink, not this one.
  const destroySink = pushDestroySink();

  // The scope wraps both the constructor and the tracking effect so that any
  // `effect()` the user creates in the constructor is captured and disposed
  // together with everything else when the logic instance is torn down.
  const cleanupSignals = effectScope(() => {
    const getInstances = collectInjectedInstances();

    try {
      instance = new logicClass() as LogicInstance<T>;
    } finally {
      popDestroySink();
    }
    instance[INSTANCE_ID_SYMBOL] = instanceId;

    injectedInstances = getInstances();

    effect(() => {
      injectedInstances.forEach(i => runSignalsInInstance(i));
      runSignalsInInstance(instance);
      // Run the effect handler in a separate tick to ensure all signals are updated, but not in the same effect cycle
      setTimeout(() => effectHandler(instance));
    });
  });

  return { rootInstance: instance, cleanupSignals, destroySink, instanceId };
};

/**
 * A React hook to use a logic class with dependency injection and state management.
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
export const useLogic = <T extends object>(logicClass: LogicClass<T>, cleanup?: (instance: LogicInstance<T>) => void) => {
  const injector = useContext(InjectionContext) ?? getGlobalContext();
  const [stateInstance, setStateInstance] = useState<{ i: LogicInstance<T> } | undefined>();

  const { rootInstance, cleanupSignals, destroySink, instanceId } = useMemo(() => {
    const stopInjectionContext = setInjectionLifecycleContext(injector);

    const res = createLogicInstance(logicClass, (i) => {
      setStateInstance({ i });
    });

    stopInjectionContext();

    return res;
  }, [logicClass, injector]);

  useEffect(() => {
    return () => {
      console.debug(`Cleaning up logic instance for ${logicClass.name}@${instanceId}`);
      cleanupSignals();
      runDestroySink(destroySink);
      if (cleanup) {
        cleanup(rootInstance);
      }
    };
  }, [cleanup, cleanupSignals, destroySink, rootInstance, instanceId, logicClass]);

  return stateInstance?.i ?? rootInstance;
};
