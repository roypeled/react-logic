import {useContext} from "react";
import {getInjectionLifecycleContext, InjectionContext} from "./injection-context";
import {InjectionType} from "./types";

type Optional = { optional: true };
type NotOptional = { optional?: false };

export type InjectOptions = Optional | NotOptional;

type ValueByOptions<T, O extends InjectOptions | undefined> = O extends undefined ? T : O extends Optional ? T | null : T;

type InjectFn = {
    <T>(token: InjectionType<T>): T;
    <T, O extends InjectOptions>(token: InjectionType<T>, options:O): ValueByOptions<T,O>;
}

export const inject:InjectFn = (token:InjectionType<unknown>, options?:InjectOptions) => {
    const injector = getInjectionLifecycleContext() ?? useContext(InjectionContext);
    return injector.get(token, options?.optional);
}