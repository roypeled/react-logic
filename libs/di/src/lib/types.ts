import {InjectionToken} from "./injection-token";

export type Class<T> = new () => T;

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

export type Provider<T = unknown> = ValueProvider<T> | ClassProvider<T> | FactoryProvider<T>;