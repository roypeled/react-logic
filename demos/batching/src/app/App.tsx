import { useLogic } from '@react-logic/react-logic';
import { FormLogic } from './logic';
import styles from './styles.module.css';

export const App = () => {
  const logic = useLogic(FormLogic);

  return (
    <main>
      <h1>Batching demo</h1>
      <p className="subtitle">
        An effect "saves" on every signal change. Reset writes three fields
        — with <code>batch</code>, that's one save; without, three.
      </p>

      <div className={styles.card}>
        <div className={styles.savesRow}>
          <span className={styles.savesLabel}>Effect runs (≈ saves)</span>
          <span className={styles.savesCount}>{logic.saves()}</span>
        </div>

        <pre className={styles.snapshot}>
          {JSON.stringify(logic.snapshot(), null, 2)}
        </pre>

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={() => logic.resetUnbatched()}
          >
            Reset (no batch) → +3 saves
          </button>
          <button
            className={`${styles.btn} ${styles.btnGood}`}
            onClick={() => logic.resetBatched()}
          >
            Reset (with batch) → +1 save
          </button>
          <button
            className={`${styles.btn} ${styles.btnNeutral}`}
            onClick={() => logic.restore()}
          >
            Restore defaults
          </button>
        </div>
      </div>
    </main>
  );
};
