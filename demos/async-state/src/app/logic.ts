import { state } from '@react-logic/react-logic';
import { asyncState } from '@react-logic/utils';

interface User {
  id: number;
  name: string;
  email: string;
  company: { name: string };
}

/**
 * `asyncState` re-runs its producer whenever a signal it reads changes.
 * Here, writing `userId(n)` re-fetches the profile automatically — no
 * useEffect, no dependency arrays.
 *
 * Loading and error states live on companion `state` signals because
 * `asyncState` itself only models the value.
 */
export class ProfileLogic {
  userId = state(1);
  loading = state(false);
  error = state<string | null>(null);

  profile = asyncState<User | null>(async () => {
    const id = this.userId();
    this.loading(true);
    this.error(null);
    try {
      const r = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as User;
    } catch (e) {
      this.error(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      this.loading(false);
    }
  });
}
