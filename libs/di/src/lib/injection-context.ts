import {InjectionType, Provider} from "./types";
import {createContext} from "react";
import {InjectionToken} from "./injection-token";

const log = console.log;

function tokenName(token: InjectionType<unknown>) {
    if (token instanceof InjectionToken) return token.toString();
    return token.name;
}

export class InjectionContextInstance {
    private providers: Map<InjectionType<unknown>, Provider>;

    private currentInjectionTree = [] as InjectionType<unknown>[];

    constructor(
        providers: Provider[],
        private name: string,
        private instances = new Map<InjectionType<unknown>, unknown>()) {
        this.providers = new Map(providers?.map(p => [p.provide, p]));
    }

    getProviders() {
        return this.providers.values();
    }

    getInstance() {
        return this.instances;
    }

    addProvider(provider: Provider) {
        this.providers.set(provider.provide, provider);
    }

    get<T>(token: InjectionType<T>, optional = false): T |null {
        if (this.currentInjectionTree.find(t => t === token))
            throw this.error(`Circular dependency! ${[...this.currentInjectionTree, token].map(tokenName).join(' -> ')}`);

        injectLifecycleContext.push(this);

        if (this.instances.has(token)) return this.instances.get(token) as T;

        const provider = this.providers.get(token);
        if (!provider) {
            if (!optional)
                throw this.error(`Injection error! Unknown provider for ${tokenName(token)}`);
            return null;
        }

        this.currentInjectionTree.push(token);

        let instance = this.createInstance<T>(provider as Provider<T>, token);

        this.instances.set(token, instance);

        injectLifecycleContext.pop();
        this.currentInjectionTree.pop();
        return instance;
    }

    private createInstance<T>(provider: Provider<T>, token: InjectionType<T>) {
        if ('useValue' in provider) {
            log(`Creating value instance for ${tokenName(token)}`)
            return provider.useValue;
        }

        if ('useClass' in provider) {
            log(`Creating class instance for ${tokenName(token)}`)
            return new provider.useClass();
        }

        if ('useFactory' in provider) {
            log(`Creating factory instance for ${tokenName(token)}`)
            return provider.useFactory();
        }

        throw this.error(`Invalid provider type!`)
    }

    private error(msg: string) {
        return new Error(`[${this.name}] ${msg}`)
    }

    static fromContext(context: InjectionContextInstance, providers: Provider[]) {
        return new InjectionContextInstance(
            [...context.getProviders(), ...providers],
            'injector',
            context.getInstance(),
        )
    }
}

const injectLifecycleContext = [] as InjectionContextInstance[];

const globalContext = new InjectionContextInstance([], 'Global injection context');

export const getGlobalContext = () => globalContext;

export const InjectionContext = createContext(getGlobalContext());

export const getInjectionLifecycleContext = () => injectLifecycleContext.at(-1);
