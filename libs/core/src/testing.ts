/**
 * @module @react-logic/core/testing
 *
 * Testing helpers — wraps the verbose adapter ceremony for unit-testing logic
 * classes with mocked dependencies. Available via:
 *
 * ```ts
 * import { createTestInjectionScope, flushAsyncSignals } from '@react-logic/core/testing';
 * ```
 */
import {
  Class,
  getDIAdapter,
  Provider,
  ProviderEntry,
  setDefaultAdapterLogger,
} from '@react-logic/di';
import { LogicClass } from './lib/use.logic';

// Once a test scope has enabled visible logging, leave it on for the rest
// of the process — repeated swaps just churn references and the default
// adapter's log function is a single global anyway.
let testLoggingInstalled = false;

const isLoggingDisabledByEnv = (): boolean => {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env) return false;
  const flag = env['REACT_LOGIC_TEST_LOG'];
  return flag === '0' || flag === 'false';
};

const enableTestLogging = () => {
  if (testLoggingInstalled) return;
  setDefaultAdapterLogger((...args: unknown[]) => console.log('[react-logic]', ...args));
  testLoggingInstalled = true;
};

const normalize = (entry: ProviderEntry): Provider => {
  if (typeof entry === 'function') {
    const cls = entry as Class<unknown>;
    return { provide: cls, useClass: cls };
  }
  return entry;
};

/**
 * Handle returned by `createTestInjectionScope` for constructing logic
 * instances and disposing the whole scope at the end of a test.
 */
export interface TestInjectionScope {
  /**
   * Construct a logic class through the test scope. The instance's destroy
   * callbacks are tracked and run on `dispose()`.
   */
  build<T extends object>(logicClass: LogicClass<T>): T;

  /**
   * Dispose every constructed logic instance (in reverse order), then the
   * scope itself — running service `onDestroy` callbacks. Call once per test,
   * usually from `afterEach`.
   */
  dispose(): void;
}

/**
 * Build a disposable test injection scope.
 *
 * Replaces this boilerplate:
 *
 * ```ts
 * const adapter = getDIAdapter();
 * const scope = adapter.createScope([{ provide: Api, useValue: fakeApi }], adapter.rootScope);
 * const built = adapter.construct(scope, () => new MyLogic());
 * const logic = built.result;
 * // ...assert...
 * built.dispose();
 * adapter.disposeScope(scope);
 * ```
 *
 * with:
 *
 * ```ts
 * const test = createTestInjectionScope([{ provide: Api, useValue: fakeApi }]);
 * const logic = test.build(MyLogic);
 * // ...assert...
 * test.dispose();
 * ```
 *
 * Bare classes are accepted in the providers array as shorthand for
 * `{ provide: C, useClass: C }`. Multiple `build()` calls share the same
 * scope, so they all see the same provider overrides.
 *
 * **Logging.** By default, the helper routes the default adapter's
 * construction events ("Creating class instance for X", etc.) to
 * `console.log` so they show up in test output — useful for understanding
 * which services constructed in what order during a failing test. Disable
 * with `{ log: false }` per call, or globally by setting
 * `REACT_LOGIC_TEST_LOG=0` (or `=false`) in the environment.
 *
 * @param providers - Providers to install on the test scope. Bare classes
 *   are accepted as shorthand.
 * @param options - Configuration. `log: false` opts the test out of routing
 *   adapter logs to `console.log`.
 */
export const createTestInjectionScope = (
  providers: ProviderEntry[] = [],
  options: { log?: boolean } = {}
): TestInjectionScope => {
  const wantsLog = options.log ?? !isLoggingDisabledByEnv();
  if (wantsLog) enableTestLogging();

  const adapter = getDIAdapter();
  const scope = adapter.createScope(providers.map(normalize), adapter.rootScope);
  const built: Array<{ dispose: () => void }> = [];

  return {
    build<T extends object>(logicClass: LogicClass<T>): T {
      const constructed = adapter.construct(scope, () => new logicClass());
      built.push({ dispose: constructed.dispose });
      return constructed.result as T;
    },
    dispose() {
      for (let i = built.length - 1; i >= 0; i--) {
        built[i].dispose();
      }
      built.length = 0;
      adapter.disposeScope(scope);
    },
  };
};

/**
 * Flush microtasks so `asyncState` producers can resolve. The producer runs
 * one tick after construction; its awaited promise lands one tick after
 * that. This helper covers both.
 *
 * For deeper async chains, prefer `flushAsyncSignalsUntil` — it polls the
 * read until a value lands, no matter how many ticks it took.
 */
export const flushAsyncSignals = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

/**
 * Flush microtasks until `read` returns a non-undefined value, then return
 * that value. Useful for async signal chains where the number of microtasks
 * isn't predictable (multi-await producers, chained `asyncState`s, etc.).
 *
 * Throws if the getter is still `undefined` after `maxFlushes` ticks (default
 * 100) — that's deliberate: tests should fail loudly rather than hang. The
 * default bound is generous enough for any realistic chain; if you hit it,
 * something genuinely isn't resolving.
 *
 * @example
 * ```ts
 * const data = await flushAsyncSignalsUntil(() => logic.myData());
 * expect(data.id).toBe(42);
 * ```
 */
export const flushAsyncSignalsUntil = async <T>(
  read: () => T | undefined,
  options: { maxFlushes?: number } = {}
): Promise<T> => {
  const { maxFlushes = 100 } = options;
  for (let i = 0; i < maxFlushes; i++) {
    const value = read();
    if (value !== undefined) return value;
    await Promise.resolve();
  }
  throw new Error(
    `flushAsyncSignalsUntil: getter returned undefined for ${maxFlushes} consecutive flushes`
  );
};
