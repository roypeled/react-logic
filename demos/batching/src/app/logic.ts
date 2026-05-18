import {
  batch,
  computedState,
  effect,
  state,
} from '@react-logic/react-logic';

/**
 * Three fields + one effect that "saves" on any change. Without `batch`,
 * resetting all three fires the effect three times. With `batch`, once.
 */
export class FormLogic {
  name = state('Alice');
  email = state('alice@example.com');
  age = state(30);

  saves = state(0);                      // count of effect runs
  snapshot = computedState(() => ({
    name: this.name(),
    email: this.email(),
    age: this.age(),
  }));

  constructor() {
    effect(() => {
      // Read all three to subscribe.
      this.name();
      this.email();
      this.age();
      this.saves(this.saves() + 1);
    });
  }

  resetUnbatched() {
    this.name('');
    this.email('');
    this.age(0);
  }

  resetBatched() {
    batch(() => {
      this.name('');
      this.email('');
      this.age(0);
    });
  }

  restore() {
    batch(() => {
      this.name('Alice');
      this.email('alice@example.com');
      this.age(30);
      // Reset the saves counter alongside — also coalesced.
      this.saves(0);
    });
  }
}
