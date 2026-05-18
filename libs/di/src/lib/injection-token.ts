export class InjectionToken<T> {
    private type:T | null = null;

    constructor(public description:string = 'unnamed') {
    }

    toString() {
        return `Injection token: ${this.description}`
    }
}