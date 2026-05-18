import { InjectionType, Provider } from './types';
import { createContext } from 'react';
import { effectScope, setActiveSub } from 'alien-signals';
import { InjectionToken } from './injection-token';
import { DestroySink, popDestroySink, pushDestroySink, runDestroySink } from './lifecycle';

const log = console.debug;

let shouldCollectInstances = false;
const collectedInstances = new Set<unknown>();

type IsOptional<O, T> = O extends true ? T : T | null;

function tokenName(token: InjectionType<unknown>) {
  if (token instanceof InjectionToken) return token.toString();
  return token.name;
}

/**
 * Error thrown when there is an issue during the injection process.
 */
export class InjectionError extends Error {
  constructor(message: string, injectorName: string) {
    super(`[${injectorName} Injector] ${message}`);
    this.name = 'InjectionError';
  }
}

/**
 * Error thrown when no provider is found for a requested injection type.
 */
export class UnresolvedInjectionError extends Error {
  constructor(type: InjectionType<unknown>, injectorName: string) {
    super(`[${injectorName} Injector] No provider found for type: ${type.toString()}`);
    this.name = 'UnresolvedInjectionError';
  }
}

/**
 * Error thrown when a circular dependency is detected during the injection process.
 */
export class CircularDependencyInjectionError extends Error {
  constructor(type: InjectionType<unknown>, injectionTreeType:InjectionType<unknown>[], injectorName: string) {
    const injectionPath = [...injectionTreeType.map(tokenName), tokenName(type)].join(' -> ');
    super(`[${injectorName} Injector] Circular dependency detected for type: ${type.toString()}.
    Injection path: ${injectionPath}`);
    this.name = 'CircularDependencyInjectionError';
  }
}

/**
 * Represents an injection context that manages providers and their instances.
 * Allows for dependency resolution and instance creation.
 * @class InjectionContextInstance
 * @example
 * ```ts
 * const context = new InjectionContextInstance([
 *   { provide: MyService, useClass: MyServiceImpl },
 *   { provide: 'API_URL', useValue: 'https://api.example.com' },
 * ]);
 *
 * const myService = context.get(MyService);
 * const apiUrl = context.get('API_URL');
 * ```
 */
export class InjectionContextInstance {
  private providers: Map<InjectionType<unknown>, Provider>;
  private instances = new Map<InjectionType<unknown>, unknown>();
  private instanceSinks = new Map<InjectionType<unknown>, DestroySink>();
  private currentInjectionTree = [] as InjectionType<unknown>[];

  /**
   * Creates an instance of InjectionContextInstance.
   * @param providers - An array of providers to register in the context.
   * @param name - The name of the injection context.
   * @param parent - Optional parent context. Resolution falls through to the
   *   parent when this context has no matching provider, but each context
   *   owns its own instance cache and destroy sinks.
   */
  constructor(
    providers: Provider[],
    private name: string,
    private parent?: InjectionContextInstance
  ) {
    this.providers = new Map(providers?.map(p => [p.provide, p]));
  }

  /**
   * Gets the providers registered directly on this context (does not include
   * inherited providers).
   */
  getProviders() {
    return this.providers.values();
  }

  /**
   * Gets the instances cached directly on this context (does not include
   * instances cached on a parent).
   */
  getInstance() {
    return this.instances;
  }

  /**
   * Adds a provider to this context.
   */
  addProvider(provider: Provider) {
    this.providers.set(provider.provide, provider);
  }

  /**
   * Resolves a token. Lookup order: own instance cache, own provider, then
   * delegate to parent. If neither this context nor any ancestor has a
   * provider, a class token is auto-registered on this context (creating a
   * scoped singleton tied to this context's lifetime).
   */
  get<T, O extends boolean | undefined>(token: InjectionType<T>, optional?:O): IsOptional<O, T> {
    if (this.currentInjectionTree.find(t => t === token))
      throw new CircularDependencyInjectionError(token, this.currentInjectionTree, this.name);

    if (this.instances.has(token)) return this.instances.get(token) as T;

    if (!this.providers.has(token) && this.parent) {
      return this.parent.get(token, optional);
    }

    return this.constructLocally<T, O>(token, optional);
  }

  private constructLocally<T, O extends boolean | undefined>(
    token: InjectionType<T>,
    optional?: O
  ): IsOptional<O, T> {
    let provider = this.providers.get(token) as Provider<T> | undefined;

    if (!provider) {
      // No provider here and no parent matched — auto-register class tokens
      // locally so the resulting instance is scoped to this context.
      if (typeof token === 'function') {
        log(`Creating default class provider for ${tokenName(token)}`);
        provider = { provide: token, useClass: token as new () => T };
        this.providers.set(token, provider);
      } else {
        if (!optional)
          throw new UnresolvedInjectionError(token, this.name);
        return null as IsOptional<O, T>;
      }
    }

    this.currentInjectionTree.push(token);
    injectLifecycleContext.push(this);

    // value providers don't construct anything, so they don't need a sink
    const needsSink = !('useValue' in provider);
    const sink = needsSink ? pushDestroySink() : undefined;

    let instance!: T;
    let scopeCleanup: (() => void) | undefined;
    try {
      if (needsSink) {
        // Wrap construction in its own effectScope so signals-effects created
        // inside the service constructor are owned by *this* service's
        // lifetime, not by any outer scope (e.g. useLogic's). We clear the
        // active subscriber first so the new scope is a root, not a child of
        // whatever scope is currently active — alien-signals disposes scope
        // trees, so being a child would still tie the service's effects to
        // the outer scope's lifetime.
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
      if (needsSink) popDestroySink();
      injectLifecycleContext.pop();
      this.currentInjectionTree.pop();
    }

    if (sink && scopeCleanup) sink.push(scopeCleanup);

    this.instances.set(token, instance);
    if (sink && sink.length) this.instanceSinks.set(token, sink);

    if (shouldCollectInstances && instance)
      collectedInstances.add(instance);

    return instance as IsOptional<O, T>;
  }

  /**
   * Creates an instance based on the provider type.
   */
  private createInstance<T>(provider: Provider<T>, token: InjectionType<T>) {
    if ('useValue' in provider) {
      log(`Creating value instance for ${tokenName(token)}`);
      return provider.useValue;
    }

    if ('useClass' in provider) {
      log(`Creating class instance for ${tokenName(token)}`);
      return new provider.useClass();
    }

    if ('useFactory' in provider) {
      log(`Creating factory instance for ${tokenName(token)}`);
      return provider.useFactory();
    }

    throw new InjectionError(`Unknown provider type for token: ${tokenName(token)}`, this.name);
  }

  /**
   * Creates a child context that delegates to `parent` for unresolved tokens.
   * The child has its own instance cache and destroy sinks, so disposing the
   * child does not affect the parent.
   */
  static fromContext(parent: InjectionContextInstance, providers: Provider[]) {
    return new InjectionContextInstance(providers, 'injector', parent);
  }

  /**
   * Disposes this context: runs every locally-constructed instance's destroy
   * sink, then clears local caches. Parent contexts are left untouched.
   * Called when an Injector unmounts (per-Injector teardown) and on HMR
   * (global context teardown).
   */
  dispose() {
    for (const sink of this.instanceSinks.values()) {
      runDestroySink(sink);
    }
    this.instanceSinks.clear();
    this.instances.clear();
    this.providers.clear();
    this.currentInjectionTree = [];
  }
}

const injectLifecycleContext = [] as InjectionContextInstance[];

const globalContext = new InjectionContextInstance([], 'Global injection context');

/**
 * Gets the global injection context.
 * @returns The global InjectionContextInstance.
 */
export const getGlobalContext = () => globalContext;

/**
 * The React context for dependency injection.
 */
export const InjectionContext = createContext(getGlobalContext());

/**
 * Collects injected instances during the execution of a function.
 * This is used when creating logic classes to track which dependencies were injected.
 * @returns A function that, when called, stops the collection and returns the collected instances.
 * @example
 * ```ts
 * const getInstances = collectInjectedInstances();
 * // ... perform injections ...
 * const instances = getInstances(); // Get collected instances
 * ```
 */
export const collectInjectedInstances = () => {
  shouldCollectInstances = true;
  collectedInstances.clear();

  return () => {
    shouldCollectInstances = false;
    const instances = Array.from(collectedInstances);
    collectedInstances.clear();
    return instances;
  }
}

/**
 * Sets the current injection lifecycle context.
 * Used internally during logic class creation to inject dependencies from the correct context.
 * @param context - The InjectionContextInstance to set as the current context.
 * @returns A function that, when called, restores the previous context.
 * @example
 * ```ts
 * const restoreContext = setInjectionLifecycleContext(myContext);
 * // ... perform injections within myContext ...
 * restoreContext(); // Restore previous context
 * ```
 */
export const setInjectionLifecycleContext = (context: InjectionContextInstance) => {
  injectLifecycleContext.push(context);

  return () => {
    injectLifecycleContext.pop();
  }
}

/**
 * Gets the current injection lifecycle context.
 * @returns The current InjectionContextInstance.
 * @returns Will return the global context if no context is set.
 * @example
 * ```ts
 * const context = getInjectionLifecycleContext();
 * const myService = context.get(MyService);
 * ```
 */
export const getInjectionLifecycleContext = () => injectLifecycleContext.at(-1) ?? globalContext;

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    globalContext.dispose();
  });
}
