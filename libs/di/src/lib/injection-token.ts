/**
 * A unique token that can be used in a DI system to provide and inject dependencies.
 */
export class InjectionToken<T> {
    // @ts-expect-error for type inference only
  private type:T | null = null;

    constructor(public description = 'unnamed') {
    }

    toString() {
        return `Injection token: ${this.description}`
    }
}
