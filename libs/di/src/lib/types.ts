import {InjectionToken} from "./injection-token";
import { PropsWithChildren } from 'react';

/**
 * A constructable class with a zero-argument constructor — i.e. something that
 * can be instantiated by the DI container without further input.
 *
 * The DI container can inject services that take constructor arguments, but
 * those arguments must come from `inject()` calls inside the constructor body
 * (or from field initializers), not from positional parameters. That's why
 * the type is `new () => T` and not `new (...args: any[]) => T`.
 *
 * @typeParam T - The instance type the constructor produces.
 * @category Types
 */
export type Class<T> = new () => T;

/**
 * Anything that can identify a dependency in the DI container — either a
 * concrete class (used as both token and constructor) or an `InjectionToken`
 * for opaque/value dependencies.
 *
 * Using a class as a token gives you both the identity and a default
 * implementation in one — `inject(MyService)` works without any explicit
 * provider registration. `InjectionToken` is needed when the dependency has
 * no class identity (a config string, a function, a primitive value).
 *
 * @typeParam T - The type the token resolves to.
 * @category Types
 */
export type InjectionType<T> = InjectionToken<T> | Class<T>;

type BaseProvider<T> = {
    provide: InjectionType<T>,
}

type ValueProvider<T> = {
    useValue: T,
} & BaseProvider<T>;

type ClassProvider<T> = {
    useClass: Class<T>,
} & BaseProvider<T>;

type FactoryProvider<T> = {
    useFactory: () => T,
} & BaseProvider<T>;

/**
 * Tells the DI container how to produce an instance for a given token. Three
 * kinds:
 *
 * - **Value provider** — supply a pre-built value. Used for primitives,
 *   pre-existing service instances, configuration objects.
 * - **Class provider** — give the container a class to instantiate when the
 *   token is first requested. The instance is cached for the lifetime of the
 *   scope.
 * - **Factory provider** — run a function to produce the value. Useful when
 *   construction needs control flow or asynchronous setup that doesn't fit a
 *   plain constructor.
 *
 * For all three, the result is cached per-scope: every consumer of the token
 * within the same scope receives the same instance/value. Disposal happens
 * when the scope's `<Injector>` unmounts (or on HMR for the global scope).
 *
 * @typeParam T - The type of the provided dependency.
 * @category Types
 * @example
 * ```ts
 * const valueProvider: Provider<string> = {
 *   provide: API_URL,
 *   useValue: 'https://api.example.com',
 * };
 *
 * const classProvider: Provider<MyService> = {
 *   provide: MyService,
 *   useClass: MyServiceImpl,
 * };
 *
 * const factoryProvider: Provider<MyService> = {
 *   provide: MyService,
 *   useFactory: () => new MyServiceImpl(loadConfig()),
 * };
 * ```
 */
export type Provider<T = unknown> = ValueProvider<T> | ClassProvider<T> | FactoryProvider<T>;

/**
 * An entry in an `Injector`'s `provide` array.
 *
 * A bare class is sugar for `{ provide: Class, useClass: Class }` — equivalent
 * to "use this class as both the token and its own implementation". This is
 * the most common case: provide a class, get its instances on demand.
 *
 * Mix bare classes with full `Provider` objects freely:
 * `provide={[CounterStore, { provide: API_URL, useValue: '/api' }]}`.
 *
 * @typeParam T - The type the provider entry resolves to.
 * @category Types
 */
export type ProviderEntry<T = unknown> = Provider<T> | Class<T>;

/**
 * The shape of the `provide` prop accepted by `<Injector>`. Extracted so it
 * can be reused on custom wrapper components that pass providers through.
 *
 * @category Types
 */
export type InjectionProvidersConfig = {
  /**
   * Providers to add to the surrounding injection scope. Bare classes are
   * accepted as shorthand for `{ provide: C, useClass: C }`. The order of
   * the array doesn't matter; tokens are looked up by identity.
   */
  provide?: ProviderEntry[];
};

/**
 * Props for `<Injector>` — providers plus React children. Use this if you
 * write a wrapper component that forwards props to `<Injector>` so the
 * children/providers types stay correct.
 *
 * @category Types
 */
export type InjectorProviderProps = PropsWithChildren & InjectionProvidersConfig;
