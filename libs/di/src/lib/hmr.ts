import { resetDefaultAdapterScopes } from './default-adapter';

/**
 * Bundler glue lives here. The library doesn't auto-wire any HMR — each
 * bundler exposes a different API (Vite's `vite:beforeUpdate` event, Webpack's
 * `module.hot.dispose`, Parcel's `module.hot.dispose`, etc.), so the user
 * passes in their bundler's HMR handle and we wire the reset.
 *
 * Call once from your app's entry file, guarded by the appropriate `if`.
 */

/** Minimal structural type for Vite's `import.meta.hot`. */
interface ViteHot {
  on(event: 'vite:beforeUpdate', cb: () => void): void;
}

/** Minimal structural type for Webpack's `import.meta.webpackHot` / `module.hot`. */
interface DisposableHot {
  dispose(cb: () => void): void;
}

/**
 * Wires the default adapter's reset into Vite's pre-update event so every
 * HMR cycle disposes the global scope cleanly.
 *
 * @example
 * ```ts
 * // main.tsx
 * import { installViteHMR } from '@react-logic/di';
 * installViteHMR(import.meta.hot);
 * ```
 *
 * @category HMR
 */
export const installViteHMR = (hot: ViteHot | undefined | false): void => {
  if (!hot) return;
  hot.on('vite:beforeUpdate', resetDefaultAdapterScopes);
};

/**
 * Wires the default adapter's reset into Webpack's HMR dispose hook. Webpack
 * fires this when *this* module is replaced; pair with `module.hot.accept()`
 * if you want it to fire on broader updates.
 *
 * @example
 * ```ts
 * // main.tsx
 * import { installWebpackHMR } from '@react-logic/di';
 * installWebpackHMR(import.meta.webpackHot);
 * ```
 *
 * @category HMR
 */
export const installWebpackHMR = (hot: DisposableHot | undefined | false): void => {
  if (!hot) return;
  hot.dispose(resetDefaultAdapterScopes);
};

/**
 * Wires the default adapter's reset into Parcel's HMR dispose hook.
 *
 * @example
 * ```ts
 * // main.tsx
 * import { installParcelHMR } from '@react-logic/di';
 * // Parcel exposes HMR via the CommonJS-style `module.hot`.
 * installParcelHMR((module as unknown as { hot?: { dispose(cb: () => void): void } }).hot);
 * ```
 *
 * @category HMR
 */
export const installParcelHMR = (hot: DisposableHot | undefined | false): void => {
  if (!hot) return;
  hot.dispose(resetDefaultAdapterScopes);
};
