import {getInjectionLifecycleContext} from "./injection-context";
import {InjectionType} from "./types";

type Optional = { optional: true };
type NotOptional = { optional?: false };

/**
 * Injection options for the `inject` function.
 * @property optional - If true, the injection will return null if the dependency is not found.
 */
export type InjectOptions = Optional | NotOptional;

type ValueByOptions<T, O extends InjectOptions | undefined> = O extends undefined ? T : O extends Optional ? T | null : T;

type InjectFn = {
    <T>(token: InjectionType<T>): T;
    <T, O extends InjectOptions>(token: InjectionType<T>, options:O): ValueByOptions<T,O>;
}

/**
 * Inject a dependency from the current injection context.
 * To be used inside logic classes or other injected constructs.
 * @param token - The injection token or class to resolve.
 * @param options - Optional injection options.
 * @returns The resolved dependency instance.
 * @example
 * ```ts
 * class MyService {
 *   constructor() {
 *     // ...
 *   }
 * }
 *
 * class MyLogic {
 *   myService = inject(MyService)
 * }
 * ```
 */
export const inject:InjectFn = (token:InjectionType<unknown>, options?:InjectOptions) => {
    const injector = getInjectionLifecycleContext();
    return injector.get(token, options?.optional);
}
