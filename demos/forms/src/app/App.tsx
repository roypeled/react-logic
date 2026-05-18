import { useLogic } from '@react-logic/react-logic';
import { useForm } from '@react-logic/utils';
import { SignupLogic } from './logic';
import styles from './styles.module.css';

export const App = () => {
  const logic = useLogic(SignupLogic);
  const Form = useForm(logic.form);
  const snap = logic.form();
  const submitted = logic.submitted();

  // Helper: render the per-validator error map as a list of strings.
  const errs = (m: Record<string, string | null>): string[] =>
    Object.values(m).filter((v): v is string => v !== null);

  return (
    <main>
      <h1>Forms demo</h1>
      <p className="subtitle">
        <code>formState</code> with built-in validators, a nested group, and
        the <code>Form.inputs</code> sugar. HTML attrs (
        <code>required</code>, <code>pattern</code>, <code>type</code>) flow
        from validators into each <code>&lt;input&gt;</code>.
      </p>

      <Form onSubmit={(v) => logic.submit(v)} className={styles.card}>
        <div className={styles.field}>
          <label>Name</label>
          <Form.inputs.name placeholder="Alice" />
          {snap.touched.name && (
            <ul className={styles.errors}>
              {errs(snap.errors.name).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.field}>
          <label>Email</label>
          <Form.inputs.email placeholder="alice@example.com" />
          {snap.touched.email && (
            <ul className={styles.errors}>
              {errs(snap.errors.email).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.field}>
          <label>Password</label>
          <Form.inputs.password type="password" />
          {snap.touched.password && (
            <ul className={styles.errors}>
              {errs(snap.errors.password).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.field}>
          <label>Age</label>
          <Form.inputs.age />
          {snap.touched.age && (
            <ul className={styles.errors}>
              {errs(snap.errors.age).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.field}>
          <label>Country</label>
          <Form.inputs.country>
            <option value="">— choose —</option>
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="CA">Canada</option>
          </Form.inputs.country>
          {snap.touched.country && (
            <ul className={styles.errors}>
              {errs(snap.errors.country).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>

        <fieldset className={styles.fieldset}>
          <legend>Address</legend>
          <div className={styles.field}>
            <label>Street</label>
            <Form.inputs.address.street />
            {snap.touched.address.street && (
              <ul className={styles.errors}>
                {errs(snap.errors.address.street).map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.field}>
            <label>City</label>
            <Form.inputs.address.city />
            {snap.touched.address.city && (
              <ul className={styles.errors}>
                {errs(snap.errors.address.city).map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.field}>
            <label>ZIP</label>
            <Form.inputs.address.zip placeholder="12345" />
            {snap.touched.address.zip && (
              <ul className={styles.errors}>
                {errs(snap.errors.address.zip).map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        </fieldset>

        <div className={styles.checkboxRow}>
          <Form.inputs.agree id="agree" />
          <label htmlFor="agree">I agree to the terms</label>
        </div>
        {snap.touched.agree && (
          <ul className={styles.errors}>
            {errs(snap.errors.agree).map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}

        <button type="submit" className={styles.btn} disabled={!snap.valid}>
          Sign up
        </button>
      </Form>

      <aside className={styles.state}>
        <h2>Form state</h2>
        <pre>{JSON.stringify(
          {
            valid: snap.valid,
            pristine: snap.pristine,
            submitting: snap.submitting,
            submitted: snap.submitted,
            values: snap.values,
            touched: snap.touched,
            dirty: snap.dirty,
            errors: snap.errors,
          },
          null,
          2,
        )}</pre>
      </aside>

      {submitted && (
        <pre className={styles.submitted}>
          Submitted ✓{'\n'}
          {JSON.stringify(submitted, null, 2)}
        </pre>
      )}
    </main>
  );
};
