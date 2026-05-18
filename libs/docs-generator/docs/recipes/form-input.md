---
sidebar_position: 1
---

# Form input bound to state

Two-way binding between an `<input>` and a signal field. The same pattern handles text fields, selects, checkboxes, and anything else that exposes `value` and an `onChange`.

## Why a logic class

Plain React forms accumulate `useState` calls and validation logic in the component body. As the form grows, the component grows. A logic class keeps all of it — fields, derived validity, submit handler — in one testable place. The component renders, the class decides.

## The pattern

```tsx
import { useLogic } from '@react-logic/core';
import { state, computedState } from '@react-logic/state';

class SignupForm {
  email = state('');
  password = state('');
  agreeToTerms = state(false);

  emailIsValid = computedState(() => this.email().includes('@'));
  passwordIsStrong = computedState(() => this.password().length >= 8);
  canSubmit = computedState(() =>
    this.emailIsValid() && this.passwordIsStrong() && this.agreeToTerms()
  );

  submit() {
    if (!this.canSubmit()) return;
    // …send to API
  }
}

export const Signup = () => {
  const f = useLogic(SignupForm);
  return (
    <form onSubmit={(e) => { e.preventDefault(); f.submit(); }}>
      <input
        type="email"
        value={f.email()}
        onChange={(e) => f.email(e.target.value)}
      />
      {!f.emailIsValid() && f.email() && <span>Invalid email</span>}

      <input
        type="password"
        value={f.password()}
        onChange={(e) => f.password(e.target.value)}
      />
      {!f.passwordIsStrong() && f.password() && <span>Need 8+ characters</span>}

      <label>
        <input
          type="checkbox"
          checked={f.agreeToTerms()}
          onChange={(e) => f.agreeToTerms(e.target.checked)}
        />
        I agree to the terms
      </label>

      <button type="submit" disabled={!f.canSubmit()}>Sign up</button>
    </form>
  );
};
```

A signal is its own getter and setter — `f.email()` reads, `f.email(next)` writes. There's no React hook indirection in the binding.

## Validation as derived state

`computedState` is the natural home for validation. Each rule is a memoised expression of one or more fields. They re-evaluate when the underlying signals change, and consumers (`disabled`, error spans) update automatically.

## Per-field error messages

Showing errors only after a field is touched is a common UX requirement. Add a `touched` signal per field:

```ts
class SignupForm {
  emailTouched = state(false);
  // …
  emailError = computedState(() => {
    if (!this.emailTouched()) return null;
    if (!this.email()) return 'Required';
    if (!this.emailIsValid()) return 'Invalid email';
    return null;
  });
}
```

```tsx
<input
  value={f.email()}
  onChange={(e) => f.email(e.target.value)}
  onBlur={() => f.emailTouched(true)}
/>
{f.emailError() && <span>{f.emailError()}</span>}
```

## Submitting async

If submit hits a network, model the in-flight state as a separate signal:

```ts
class SignupForm {
  // …fields and validation…
  submitting = state(false);
  submitError = state<string | null>(null);

  async submit() {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting(true);
    this.submitError(null);
    try {
      await this.api.signup({ email: this.email(), password: this.password() });
      // success — clear or navigate
    } catch (e) {
      this.submitError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      this.submitting(false);
    }
  }
}
```

The button shows a loading state with `disabled={f.submitting() || !f.canSubmit()}` and you display `f.submitError()` near the form.

## Gotchas

- **Don't store fields as plain class properties** (`email = ''`). Reassigning them won't trigger re-renders — `email` has to be a signal call.
- **Don't read signals outside the render path** when you want React to subscribe. Reads inside event handlers run, but they don't subscribe the component to changes — only reads during render do.

## See also

- [Concepts → Signals](/docs/concepts/signals) — `state`, `computedState`, `asyncState` in detail.
