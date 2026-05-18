/**
 * @module @react-logic/di
 */
// Default adapter must register before any consumer queries getDIAdapter().
import './lib/default-adapter';

export type { DIAdapter } from './lib/adapter';
export { setDIAdapter, getDIAdapter } from './lib/adapter';

export * from './lib/inject';
export * from './lib/injection-token';
export * from './lib/injector-provider';
export * from './lib/types';
export * from './lib/lifecycle';

// Errors are re-exported from the default adapter — useful for catching them
// in user code regardless of which adapter is active.
export {
  InjectionError,
  UnresolvedInjectionError,
  CircularDependencyInjectionError,
  resetDefaultAdapterScopes,
  setDefaultAdapterLogger,
} from './lib/default-adapter';

export * from './lib/hmr';
