import { effectScope, setActiveSub } from 'alien-signals';
import { InjectionType, Provider } from './types';
import { InjectionToken } from './injection-token';
import { DIAdapter, setDIAdapter } from './adapter';

// Swappable so test setups can route DI lifecycle messages through console.log
// (visible in test output) instead of the default console.debug (silent in
// most runners). See `setDefaultAdapterLogger`.
let log: (...args: unknown[]) => void = (...args) => console.debug(...args);

/**
 * Swap the default adapter's logger. The adapter emits a line per
 * construction event ("Creating class instance for X", "Creating value
 * instance for Y", etc.) — by default routed to `console.debug` so it stays
 * out of the way in production. Tests can route it to `console.log` (or any
 * other sink) for visibility.
 *
 * Affects only the default adapter. Custom adapters control their own
 * logging.
 *
 * @category Adapter
 */
export const setDefaultAdapterLogger = (
  fn: (...args: unknown[]) => void
): void => {
  log = fn;
};

type DestroySink = Array<() => void>;

const sinkStack: DestroySink[] = [];

const pushSink = (): DestroySink => {
  const sink: DestroySink = [];
  sinkStack.push(sink);
  return sink;
};

const popSink = (): DestroySink | undefined => sinkStack.pop();

const runSink = (sink: DestroySink) => {
  for (let i = 0; i < sink.length; i++) {
    try {
      sink[i]();
    } catch (e) {
      console.error('onDestroy callback threw:', e);
    }
  }
  sink.length = 0;
};

const tokenName = (token: InjectionType<unknown>) => {
  if (token instanceof InjectionToken) return token.toString();
  return token.name;
};

/**
 * Generic injection failure raised by the default adapter — typically when a
 * provider is malformed (no `useValue`/`useClass`/`useFactory`). The more
 * specific subclasses below cover the common failure modes; catch this base
 * class to handle any DI-origin error uniformly.
 *
 * @category Errors
 */
export class InjectionError extends Error {
  constructor(message: string, injectorName: string) {
    super(`[${injectorName} Injector] ${message}`);
    this.name = 'InjectionError';
  }
}

/**
 * Thrown when a non-optional token has no provider in the active scope chain
 * (neither the local scope nor any of its ancestors). For class tokens this
 * never fires — they're auto-registered. It only happens with custom
 * `InjectionToken`s that no `<Injector>` provided.
 *
 * Pass `{ optional: true }` to `inject()` to receive `null` instead of this
 * error when the token is missing.
 *
 * @category Errors
 */
export class UnresolvedInjectionError extends Error {
  constructor(type: InjectionType<unknown>, injectorName: string) {
    super(`[${injectorName} Injector] No provider found for type: ${type.toString()}`);
    this.name = 'UnresolvedInjectionError';
  }
}

/**
 * Thrown when a service's constructor injects a token whose construction is
 * already in progress in the same scope — i.e. `A` injects `B` injects `A`.
 *
 * The error message includes the full injection path that triggered the
 * cycle, so you can see how the loop was reached. Resolve cycles by either
 * inverting a dependency, lazy-injecting via a factory provider that defers
 * the lookup, or splitting a service into two.
 *
 * @category Errors
 */
export class CircularDependencyInjectionError extends Error {
  constructor(type: InjectionType<unknown>, injectionTreeType: InjectionType<unknown>[], injectorName: string) {
    const injectionPath = [...injectionTreeType.map(tokenName), tokenName(type)].join(' -> ');
    super(`[${injectorName} Injector] Circular dependency detected for type: ${type.toString()}.
    Injection path: ${injectionPath}`);
    this.name = 'CircularDependencyInjectionError';
  }
}

let scopeCounter = 0;

class DefaultScope {
  private providers: Map<InjectionType<unknown>, Provider>;
  private instances = new Map<InjectionType<unknown>, unknown>();
  private instanceSinks = new Map<InjectionType<unknown>, DestroySink>();
  private currentInjectionTree: InjectionType<unknown>[] = [];

  /**
   * Human-readable label for this scope. Root is just "Global"; child scopes
   * get an auto-incrementing suffix so logs can disambiguate two injectors
   * with the same name (e.g. `injector#3` vs `injector#7`).
   */
  readonly displayName: string;

  /**
   * The token currently mid-construction in this scope, or `undefined` when
   * none. Used to attribute injection log lines to their originating caller.
   */
  get currentCaller(): InjectionType<unknown> | undefined {
    return this.currentInjectionTree.at(-1);
  }

  constructor(providers: Provider[], private name: string, private parent?: DefaultScope) {
    this.providers = new Map(providers?.map(p => [p.provide, p]));
    this.displayName = parent ? `${name}#${++scopeCounter}` : name;
  }

  get<T>(token: InjectionType<T>, optional?: boolean): T | null {
    if (this.currentInjectionTree.find(t => t === token))
      throw new CircularDependencyInjectionError(token, this.currentInjectionTree, this.name);

    if (this.instances.has(token)) return this.instances.get(token) as T;

    if (!this.providers.has(token) && this.parent) {
      return this.parent.get(token, optional);
    }

    return this.constructLocally<T>(token, optional);
  }

  private constructLocally<T>(token: InjectionType<T>, optional?: boolean): T | null {
    let provider = this.providers.get(token) as Provider<T> | undefined;

    if (!provider) {
      if (typeof token === 'function') {
        log(`Creating default class provider for ${tokenName(token)} [${this.displayName}]`);
        provider = { provide: token, useClass: token as new () => T };
        this.providers.set(token, provider);
      } else {
        if (!optional) throw new UnresolvedInjectionError(token, this.name);
        return null;
      }
    }

    this.currentInjectionTree.push(token);
    lifecycleStack.push(this);

    const needsSink = !('useValue' in provider);
    const sink = needsSink ? pushSink() : undefined;

    let instance!: T;
    let scopeCleanup: (() => void) | undefined;
    try {
      if (needsSink) {
        // Isolate service-internal effects from any outer alien-signals scope.
        const prevSub = setActiveSub(undefined);
        try {
          scopeCleanup = effectScope(() => {
            instance = this.createInstance<T>(provider as Provider<T>, token);
          });
        } finally {
          setActiveSub(prevSub);
        }
      } else {
        instance = this.createInstance<T>(provider as Provider<T>, token);
      }
    } finally {
      if (needsSink) popSink();
      lifecycleStack.pop();
      this.currentInjectionTree.pop();
    }

    if (sink && scopeCleanup) sink.push(scopeCleanup);

    this.instances.set(token, instance);
    if (sink && sink.length) this.instanceSinks.set(token, sink);

    return instance;
  }

  private createInstance<T>(provider: Provider<T>, token: InjectionType<T>): T {
    if ('useValue' in provider) {
      log(`Creating value instance for ${tokenName(token)} [${this.displayName}]`);
      return provider.useValue;
    }
    if ('useClass' in provider) {
      log(`Creating class instance for ${tokenName(token)} [${this.displayName}]`);
      return new provider.useClass();
    }
    if ('useFactory' in provider) {
      log(`Creating factory instance for ${tokenName(token)} [${this.displayName}]`);
      return provider.useFactory();
    }
    throw new InjectionError(`Unknown provider type for token: ${tokenName(token)}`, this.name);
  }

  dispose() {
    for (const sink of this.instanceSinks.values()) {
      runSink(sink);
    }
    this.instanceSinks.clear();
    this.instances.clear();
    this.providers.clear();
    this.currentInjectionTree = [];
  }
}

const lifecycleStack: DefaultScope[] = [];

let globalScope = new DefaultScope([], 'Global');

let collecting: unknown[] | null = null;

export const defaultAdapter: DIAdapter<DefaultScope> = {
  get rootScope() {
    return globalScope;
  },

  createScope(providers, parent) {
    return new DefaultScope(providers, 'injector', parent);
  },

  disposeScope(scope) {
    scope.dispose();
  },

  runIn(scope, fn) {
    lifecycleStack.push(scope);
    try {
      return fn();
    } finally {
      lifecycleStack.pop();
    }
  },

  construct(scope, fn) {
    const sink = pushSink();
    const injected: unknown[] = [];
    const prev = collecting;
    collecting = injected;
    lifecycleStack.push(scope);
    try {
      const result = fn();
      return {
        result,
        injected,
        dispose: () => runSink(sink),
      };
    } finally {
      lifecycleStack.pop();
      collecting = prev;
      popSink();
    }
  },

  inject<T>(token: InjectionType<T>, optional?: boolean): T | null {
    const scope = lifecycleStack.at(-1) ?? globalScope;
    const caller = scope.currentCaller;
    log(
      caller
        ? `Inject ${tokenName(token)} ← ${tokenName(caller)} [${scope.displayName}]`
        : `Inject ${tokenName(token)} [${scope.displayName}]`
    );
    const result = scope.get(token, optional);
    if (collecting && result !== null) collecting.push(result);
    return result;
  },

  onDestroy(fn) {
    const sink = sinkStack.at(-1);
    if (!sink) {
      throw new Error(
        'onDestroy() must be called during logic class or injected service construction'
      );
    }
    sink.push(fn);
  },
};

setDIAdapter(defaultAdapter);

/**
 * Disposes the default adapter's global scope and replaces it with a fresh
 * one. Intended for HMR cycles in dev — call from a bundler-specific hook
 * (see `installViteHMR`, `installWebpackHMR`, `installParcelHMR`) so service
 * `onDestroy` callbacks fire and stale class identities don't pile up.
 *
 * Has no effect on user-created scopes (e.g. those from `<Injector>`); their
 * lifetimes are owned by React mount/unmount.
 *
 * @category HMR
 */
export const resetDefaultAdapterScopes = (): void => {
  globalScope.dispose();
  globalScope = new DefaultScope([], 'Global');
};
