/**
 * A simple example of react-logic usage.
 * This example defines a logic class with a count state,
 * a computed double count state, and methods to increment
 * and decrement the count. The React component uses this
 * logic to display and modify the count.
 */

import { useLogic } from '@react-logic/core';
import { computedState, state } from '@react-logic/state';

// Logic class managing the state
class SimpleLogic {
  // A simple count state
  count = state(0);

  // A computed state that derives from count
  doubleCount = computedState(() => this.count() * 2);

  // Method to increment the count
  increment() {
    this.count(this.count() + 1);
  }

  // Method to decrement the count
  decrement() {
    this.count(this.count() - 1);
  }
}

// React component utilizing the SimpleLogic
export default function SimpleComponent() {
  // Use the logic within the component
  const logic = useLogic(SimpleLogic);

  return (
    <div>
      <h1>Simple Counter</h1>
      {/* Display the current count and double count */}
      <p>Count: {logic.count()}</p>
      <p>Double Count: {logic.doubleCount()}</p>
      {/* Buttons to modify the count */}
      <button onClick={() => logic.decrement()}>-</button>
      <button onClick={() => logic.increment()}>+</button>
    </div>
  );
}
