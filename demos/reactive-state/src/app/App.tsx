import { useLogic } from '@react-logic/react-logic';
import { CounterLogic } from './logic';
import styles from './styles.module.css';

export const App = () => {
  const logic = useLogic(CounterLogic);
  const now = new Date(logic.now()).toLocaleTimeString();

  return (
    <main>
      <h1>Reactive state demo</h1>
      <p className="subtitle">
        <code>state</code> · <code>computedState</code> · <code>effect</code> ·{' '}
        <code>onDestroy</code>. Increment the counter; the doubled value is a
        memoised computed, persistence runs on every change, and the clock is
        cleaned up on unmount.
      </p>

      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>Count</span>
          <span className={styles.value}>{logic.count()}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Doubled</span>
          <span className={styles.doubledValue}>{logic.doubled()}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Clock</span>
          <span className={styles.clock}>{now}</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.btn} onClick={() => logic.dec()}>
            −
          </button>
          <button className={styles.btn} onClick={() => logic.inc()}>
            +
          </button>
          <button
            className={`${styles.btn} ${styles.secondary}`}
            onClick={() => logic.reset()}
          >
            Reset
          </button>
        </div>

        <p className={styles.persistHint}>
          Count is persisted to <code>localStorage</code>. Reload the page —
          your value survives.
        </p>
      </div>
    </main>
  );
};
