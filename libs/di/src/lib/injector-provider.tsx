import { FunctionComponent, useContext, useEffect, useMemo, useRef } from 'react';
import { Class, InjectionType, InjectorProviderProps, Provider, ProviderEntry } from './types';
import { InjectionContext, InjectionContextInstance } from './injection-context';

// Bare classes in `provide` are sugar for `{ provide: C, useClass: C }`.
const normalize = (entry: ProviderEntry): Provider => {
  if (typeof entry === 'function') {
    const cls = entry as Class<unknown>;
    return { provide: cls, useClass: cls };
  }
  return entry;
};

// A render-stable view of the provide array. Inline `provide={[...]}` literals
// produce a new array reference every render — without this stabilizer the
// useMemo below would create a fresh context each time and useEffect would
// dispose the previous one, churning services on every parent re-render.
const useStableProviders = (provide?: ProviderEntry[]): Provider[] | undefined => {
  const lastRef = useRef<Provider[] | undefined>(undefined);
  const normalized = provide?.map(normalize);
  if (!sameProviders(lastRef.current, normalized)) {
    lastRef.current = normalized;
  }
  return lastRef.current;
};

const sameProviders = (a?: Provider[], b?: Provider[]): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].provide !== b[i].provide) return false;
    if (providerTarget(a[i]) !== providerTarget(b[i])) return false;
  }
  return true;
};

const providerTarget = (p: Provider): unknown => {
  if ('useValue' in p) return p.useValue;
  if ('useClass' in p) return p.useClass;
  if ('useFactory' in p) return p.useFactory;
  return null;
};

/**
 * Injector component that provides a new injection context to its children.
 * It can accept an optional array of providers to extend the current context.
 * It uses React's context API to manage the injection context.
 * It creates the injection context from the parent context and the provided providers.
 * @param provide - Optional array of providers to add to the current injection context. {@link InjectorProviderProps | TEXT}
 * @param {ReactNode} children - The child components that will have access to the new injection context.
 * @example
 * ```tsx
 * <Injector provide={[{ provide: MyService, useClass: MyServiceImpl }]}>
 *   <MyComponent />
 * </Injector>
 *
 * const MyComponent: React.FC = () => {
 *   const myService = useInjector(MyService); // Injects an instance of MyServiceImpl from the context
 *   // Use myService...
 * }
 * ```
 */
export const Injector: FunctionComponent<InjectorProviderProps> = ({ provide, children }) => {
  const currentInjector = useContext(InjectionContext);
  const stableProvide = useStableProviders(provide);

  const context = useMemo(() => {
    if (!stableProvide) return currentInjector;
    return InjectionContextInstance.fromContext(currentInjector, stableProvide);
  }, [currentInjector, stableProvide]);

  // Tear down services scoped to this Injector when it unmounts (or when its
  // context is replaced). The pass-through case (no `provide`) doesn't own
  // `context`, so we must not dispose it.
  useEffect(() => {
    if (!stableProvide) return;
    return () => context.dispose();
  }, [context, stableProvide]);

  return <InjectionContext.Provider value={context}>{children}</InjectionContext.Provider>;
};

/**
 * Hook to inject a dependency from the current injection context.
 * It retrieves the instance of the specified type from the context.
 * If no provider is found for the type, it throws an error.
 * @template T - The type of the dependency to inject.
 * @param type - The injection token or class to resolve.
 * @param optional - Optional flag indicating if the injection is optional.
 * @returns The resolved dependency instance.
 * @throws Will throw an UnresolvedInjectionError if no provider is found and the injection is not optional.
 * @example
 * ```tsx
 * // Non-optional injection
 * const MyComponent: React.FC = () => {
 *   const myService = useInjector(MyService);
 *   // Use myService...
 * }
 *
 * // Optional injection
 * const MyComponent: React.FC = () => {
 *   const myService = useInjector(MyService, true); // myService can be null if not provided
 *   // Use myService...
 * }
 * ```
 */
type UseInjectorFn = {
  <T>(type: InjectionType<T>): T;
  <T>(type: InjectionType<T>, optional: false): T;
  <T>(type: InjectionType<T>, optional: true): T | null;
};

export const useInjector: UseInjectorFn = <T,>(type: InjectionType<T>, optional?: boolean): T | null => {
  const injector = useContext(InjectionContext);
  return injector.get(type, optional);
};
