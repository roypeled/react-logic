import { FunctionComponent, PropsWithChildren, useContext, useMemo } from 'react';
import {Provider} from "./types";
import {InjectionContext, InjectionContextInstance} from "./injection-context";

/**
 * Injector component that provides a new injection context to its children.
 * It can accept an optional array of providers to extend the current context.
 * It uses React's context API to manage the injection context.
 * It creates the injection context from the parent context and the provided providers.
 * @param provide - Optional array of providers to add to the current injection context.
 * @param children - The child components that will have access to the new injection context.
 * @example
 * ```tsx
 * <Injector provide={[{ provide: MyService, useClass: MyServiceImpl }]}>
 *   <MyComponent />
 * </Injector>
 * ```
 */
export const Injector: FunctionComponent<PropsWithChildren & { provide?: Provider[] }> = ({provide, children}) => {
    const currentInjector = useContext(InjectionContext);

    const context = useMemo(() => {
        if(!provide) return currentInjector;
        return InjectionContextInstance.fromContext(currentInjector, provide);
    }, [currentInjector, provide]);

    return <InjectionContext.Provider value={context}>{children}</InjectionContext.Provider>
}
