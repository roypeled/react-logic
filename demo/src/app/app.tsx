import { onDestroy, useLogic } from '@react-logic/core';
import { computedState, state } from '@react-logic/state';
import { inject } from '@react-logic/di';
import Dropdown from './dropdown';
import SimpleComponent from './simple-logic';

class TimeService {
  time = state(0);

  state = computedState(() => (this.timer() !== null ? 'running' : 'stopped'));

  timer = state(null as null | ReturnType<typeof setInterval>);

  constructor() {
    this.start();
    onDestroy(() => this.stop());
  }

  start() {
    this.timer(
      setInterval(() => {
        this.time(this.time() + 1);
      }, 1000)
    );
  }

  stop() {
    const t = this.timer();
    if (t) clearInterval(t);
    this.timer(null);
  }
}

class AppLogic {
  timeService = inject(TimeService);

  name = state('React Logic');

  welcomeMessage = computedState(
    () =>
      `Welcome to ${this.name()}! Time elapsed: ${this.timeService.time()} seconds...`
  );

  pause() {
    this.timeService.stop();
  }

  start() {
    this.timeService.start();
  }
}

export default function App() {
  const appLogic = useLogic(AppLogic);

  return (
    <div>
      <input
        type="text"
        value={appLogic.name()}
        onChange={(e) => appLogic.name(e.target.value)}
      />
      <p>{appLogic.welcomeMessage()}</p>
      <p>{appLogic.timeService.state()}</p>
      <button onClick={() => appLogic.pause()}>Pause</button>
      <button onClick={() => appLogic.start()}>Start</button>

      <SimpleComponent></SimpleComponent>
      <Dropdown></Dropdown>
    </div>
  );
}
