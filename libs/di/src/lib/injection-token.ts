/**
 * An opaque, type-tagged identity used to register and resolve a dependency
 * in the DI container.
 *
 * Use an `InjectionToken` when the dependency has no class identity:
 * configuration strings, primitive values, plain function callbacks,
 * environment-specific objects, etc. For dependencies that *are* classes,
 * the class itself doubles as the token — no `InjectionToken` is needed.
 *
 * Each `InjectionToken` instance is unique by reference. The `description`
 * is for debugging only — two tokens constructed with the same description
 * are *different* tokens. Token identity is what makes `provide`/`inject`
 * pairs match.
 *
 * @typeParam T - The type that consumers receive when injecting this token.
 *   Phantom-only — the runtime value carries no `T`.
 * @category Tokens
 * @example
 * ```ts
 * export const API_URL = new InjectionToken<string>('API_URL');
 *
 * // Provide a value for it…
 * <Injector provide={[{ provide: API_URL, useValue: 'https://api.test' }]}>
 *   <App />
 * </Injector>
 *
 * // …then inject inside any logic class:
 * class ApiClient {
 *   url = inject(API_URL);
 * }
 * ```
 */
export class InjectionToken<T> {
    // @ts-expect-error for type inference only — used as a phantom carrier
    // so `inject(token)` can produce a typed result without a runtime cost.
  private type:T | null = null;

    constructor(public description = 'unnamed') {
    }

    toString() {
        return `Injection token: ${this.description}`
    }
}
