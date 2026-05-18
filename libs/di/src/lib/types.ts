import {InjectionToken} from "./injection-token";
import { PropsWithChildren } from 'react';

/**
 * A class type that can be instantiated.
 */
export type Class<T> = new () => T;

/**
 * An injection type that can be used as a token for dependency injection.
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
 * A provider for dependency injection, which can be a value, class, or factory provider.
 * @template T - The type of the provided dependency.
 * @example
 * ```ts
 * const valueProvider: ValueProvider<MyService> = {
 *   provide: MyService,
 *   useValue: new MyServiceImpl(),
 * };
 *
 * const classProvider: ClassProvider<MyService> = {
 *   provide: MyService,
 *   useClass: MyServiceImpl,
 * };
 *
 * const factoryProvider: FactoryProvider<MyService> = {
 *   provide: MyService,
 *   useFactory: () => new MyServiceImpl(),
 * };
 * ```
 */
export type Provider<T = unknown> = ValueProvider<T> | ClassProvider<T> | FactoryProvider<T>;

/**
 * An entry in an `Injector` provide array. A bare class is a shorthand for
 * `{ provide: Class, useClass: Class }`.
 */
export type ProviderEntry<T = unknown> = Provider<T> | Class<T>;

/**
 * Configuration for injection providers.
 * It includes an optional array of providers to extend the injection context.
 * @param provide - Optional array of providers to add to the injection context.
 *   Bare classes are accepted as a shorthand for `{ provide: C, useClass: C }`.
 */
export type InjectionProvidersConfig = {
  provide?: ProviderEntry[];
};

/**
 * Props for the Injector component.
 * It extends the InjectionProvidersConfig and includes children components.
 */
export type InjectorProviderProps = PropsWithChildren & InjectionProvidersConfig;

