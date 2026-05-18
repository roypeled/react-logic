import './default-adapter';
import { createContext, FunctionComponent, useContext, useEffect, useMemo, useRef } from 'react';
import { Class, InjectionType, InjectorProviderProps, Provider, ProviderEntry } from './types';
import { getDIAdapter } from './adapter';

// React context carrying the currently-active scope handle. Typed as
// `unknown` because the adapter owns the scope's shape — the framework only
// passes it back to the adapter.
const ScopeContext = createContext<unknown>(undefined);

const getRootScope = () => getDIAdapter().rootScope;

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
// useMemo below would create a fresh scope each time and useEffect would
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
 * Provides a new injection scope to its children, optionally extending the
 * surrounding scope with additional providers. Services constructed in this
 * scope are torn down when the Injector unmounts.
 *
 * @category Components
 * @example
 * ```tsx
 * <Injector provide={[CounterStore, { provide: API_URL, useValue: '/api' }]}>
 *   <App />
 * </Injector>
 * ```
 */
export const Injector: FunctionComponent<InjectorProviderProps> = ({ provide, children }) => {
  const parentScope = useContext(ScopeContext) ?? getRootScope();
  const stableProvide = useStableProviders(provide);

  const scope = useMemo(() => {
    if (!stableProvide) return parentScope;
    return getDIAdapter().createScope(stableProvide, parentScope);
  }, [parentScope, stableProvide]);

  useEffect(() => {
    if (!stableProvide) return;
    return () => getDIAdapter().disposeScope(scope);
  }, [scope, stableProvide]);

  return <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>;
};

type UseInjectorFn = {
  <T>(type: InjectionType<T>): T;
  <T>(type: InjectionType<T>, optional: false): T;
  <T>(type: InjectionType<T>, optional: true): T | null;
};

/**
 * Resolves a dependency from the surrounding `<Injector>` scope, scoped to
 * the React subtree where it's called.
 *
 * Use this when a *React component* (not a logic class) needs to read a
 * service directly. Inside logic classes, prefer `inject()` — it's
 * synchronous, doesn't need a hook, and is what `<useLogic>` is designed to
 * orchestrate.
 *
 * The hook does not subscribe to the resolved value's signals. If you need
 * the component to re-render when the service's state changes, call the
 * relevant signal directly inside the render body (e.g. `svc.count()`) — the
 * hook order around it is irrelevant.
 *
 * @typeParam T - The type the token resolves to. With `optional: true` the
 *   return widens to `T | null`.
 * @category Hooks
 * @example
 * ```tsx
 * // Required injection — throws if no provider is found.
 * const myService = useInjector(MyService);
 *
 * // Optional — returns null if no provider is found.
 * const maybeService = useInjector(MyService, true);
 * ```
 */
export const useInjector: UseInjectorFn = <T,>(type: InjectionType<T>, optional?: boolean): T | null => {
  const scope = useContext(ScopeContext) ?? getRootScope();
  const adapter = getDIAdapter();
  return adapter.runIn(scope, () => adapter.inject(type, optional));
};

/**
 * Internal: reads the active React-side scope handle. Used by `useLogic`.
 */
export const useCurrentScope = (): unknown => {
  return useContext(ScopeContext) ?? getRootScope();
};
