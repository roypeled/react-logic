import './default-adapter';
import { InjectionType } from './types';
import { getDIAdapter } from './adapter';

type Optional = { optional: true };
type NotOptional = { optional?: false };

export type InjectOptions = Optional | NotOptional;

type ValueByOptions<T, O extends InjectOptions | undefined> =
  O extends undefined ? T : O extends Optional ? T | null : T;

type InjectFn = {
  <T>(token: InjectionType<T>): T;
  <T, O extends InjectOptions>(token: InjectionType<T>, options: O): ValueByOptions<T, O>;
};

/**
 * Inject a dependency from the current injection context. Must be called
 * synchronously during a logic class or service constructor.
 *
 * @typeParam T - The type the token resolves to.
 * @typeParam O - The options shape. When `{ optional: true }`, the return
 *   type widens to `T | null`; otherwise it's `T`.
 * @category Functions
 * @example
 * ```ts
 * class MyLogic {
 *   service = inject(MyService);
 * }
 * ```
 */
export const inject: InjectFn = ((token: InjectionType<unknown>, options?: InjectOptions) => {
  return getDIAdapter().inject(token, options?.optional ?? false);
}) as InjectFn;
