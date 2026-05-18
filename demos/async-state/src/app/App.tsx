import { useLogic } from '@react-logic/react-logic';
import { ProfileLogic } from './logic';
import styles from './styles.module.css';

export const App = () => {
  const logic = useLogic(ProfileLogic);
  const profile = logic.profile();
  const error = logic.error();
  const loading = logic.loading();

  return (
    <main>
      <h1>Async state demo</h1>
      <p className="subtitle">
        <code>asyncState</code> re-runs the producer whenever a tracked signal
        changes. Switch users — the profile re-fetches automatically.
      </p>

      <div className={styles.card}>
        <div className={styles.row}>
          <label htmlFor="user">User</label>
          <select
            id="user"
            className={styles.select}
            value={logic.userId()}
            onChange={(e) => logic.userId(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                #{n}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.state}>
          {loading && <p>Loading…</p>}
          {error && <p className={styles.error}>Error: {error}</p>}
          {!loading && !error && profile && (
            <div className={styles.detail}>
              <span className={styles.label}>Name</span>
              <span>{profile.name}</span>
              <span className={styles.label}>Email</span>
              <span>{profile.email}</span>
              <span className={styles.label}>Company</span>
              <span>{profile.company.name}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
