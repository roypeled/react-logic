---
sidebar_position: 1
---

# Form input bound to state

Two-way binding between an `<input>` and a signal field, with derived validity and async submit.

```tsx
import { useLogic, state, computedState } from '@react-logic/react-logic';

class SignupForm {
  email = state('');
  password = state('');
  agreeToTerms = state(false);

  emailTouched = state(false);
  submitting = state(false);
  submitError = state<string | null>(null);

  emailIsValid = computedState(() => this.email().includes('@'));
  passwordIsStrong = computedState(() => this.password().length >= 8);
  canSubmit = computedState(
    () =>
      this.emailIsValid() && this.passwordIsStrong() && this.agreeToTerms()
  );

  emailError = computedState(() => {
    if (!this.emailTouched()) return null;
    if (!this.email()) return 'Required';
    if (!this.emailIsValid()) return 'Invalid email';
    return null;
  });

  async submit() {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting(true);
    this.submitError(null);
    try {
      await api.signup({ email: this.email(), password: this.password() });
    } catch (e) {
      this.submitError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      this.submitting(false);
    }
  }
}

export const Signup = () => {
  const f = useLogic(SignupForm);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        f.submit();
      }}
    >
      <input
        type="email"
        value={f.email()}
        onChange={(e) => f.email(e.target.value)}
        onBlur={() => f.emailTouched(true)}
      />
      {f.emailError() && <span>{f.emailError()}</span>}

      <input
        type="password"
        value={f.password()}
        onChange={(e) => f.password(e.target.value)}
      />
      {!f.passwordIsStrong() && f.password() && (
        <span>Need 8+ characters</span>
      )}

      <label>
        <input
          type="checkbox"
          checked={f.agreeToTerms()}
          onChange={(e) => f.agreeToTerms(e.target.checked)}
        />
        I agree to the terms
      </label>

      <button type="submit" disabled={!f.canSubmit() || f.submitting()}>
        {f.submitting() ? 'Signing up…' : 'Sign up'}
      </button>
      {f.submitError() && <span>{f.submitError()}</span>}
    </form>
  );
};
```
