import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inject, InjectionToken, Injector, onDestroy } from '@react-logic/di';
import { computedState, effect, state } from '@react-logic/state';
import { useLogic } from './use.logic';

beforeEach(() => {
  vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

const awaitTimeout = (ms: number) => new Promise((r) => setTimeout(r, ms));

const tick = () => act(async () => {
  await awaitTimeout(0);
});

describe('useLogic — basic reactivity', () => {
  it('exposes the logic instance and re-renders when a signal changes', async () => {
    class Counter {
      count = state(0);
      inc() {
        this.count(this.count() + 1);
      }
    }

    let logicRef!: Counter;
    const Comp = () => {
      const logic = useLogic(Counter);
      logicRef = logic;
      return <span data-testid="v">{logic.count()}</span>;
    };

    render(<Comp />);
    expect(screen.getByTestId('v').textContent).toBe('0');

    await act(async () => {
      logicRef.inc();
      await tick();
    });
    expect(screen.getByTestId('v').textContent).toBe('1');
  });

  it('reflects computedState updates', async () => {
    class C {
      n = state(2);
      doubled = computedState(() => this.n() * 2);
    }
    let r!: C;
    const Comp = () => {
      const logic = useLogic(C);
      r = logic;
      return <span data-testid="v">{logic.doubled()}</span>;
    };
    render(<Comp />);
    expect(screen.getByTestId('v').textContent).toBe('4');

    await act(async () => {
      r.n(5);
      await tick();
    });
    expect(screen.getByTestId('v').textContent).toBe('10');
  });

  it('re-renders when an input-variant computedState input is written', async () => {
    // Regression: the dual getter/setter returned by `computedState((q) => …)`
    // is a plain function, not an alien-signals signal/computed. `useLogic`'s
    // tracking pass must still recognise it (via the shared brand symbol)
    // and subscribe, otherwise writing the input wouldn't re-render.
    class C {
      filtered = computedState((q = '') => q.toUpperCase());
    }
    let r!: C;
    const Comp = () => {
      const logic = useLogic(C);
      r = logic;
      return <span data-testid="v">{logic.filtered()}</span>;
    };
    render(<Comp />);
    expect(screen.getByTestId('v').textContent).toBe('');

    await act(async () => {
      r.filtered('hello');
      await tick();
    });
    expect(screen.getByTestId('v').textContent).toBe('HELLO');

    await act(async () => {
      r.filtered('world');
      await tick();
    });
    expect(screen.getByTestId('v').textContent).toBe('WORLD');
  });
});

describe('useLogic — DI integration (default global injector)', () => {
  it('auto-resolves a class dependency without an Injector wrapper', () => {
    class DefaultService {
      label = state('from-default-service');
    }

    class Logic {
      service = inject(DefaultService);
    }

    const Comp = () => {
      const logic = useLogic(Logic);
      return <span data-testid="v">{logic.service.label()}</span>;
    };

    render(<Comp />);
    expect(screen.getByTestId('v').textContent).toBe('from-default-service');
  });

  it('subscribes to signals on auto-injected services', async () => {
    class CounterService {
      n = state(1);
    }
    class Logic {
      svc = inject(CounterService);
    }

    let r!: Logic;
    const Comp = () => {
      const logic = useLogic(Logic);
      r = logic;
      return <span data-testid="v">{logic.svc.n()}</span>;
    };

    render(<Comp />);
    expect(screen.getByTestId('v').textContent).toBe('1');

    await act(async () => {
      r.svc.n(99);
      await tick();
    });
    expect(screen.getByTestId('v').textContent).toBe('99');
  });
});

describe('useLogic — custom Injector providers', () => {
  it('useClass overrides the default class with a subclass', () => {
    class Greeter {
      greet() {
        return 'hello';
      }
    }
    class LoudGreeter extends Greeter {
      override greet() {
        return 'HELLO';
      }
    }
    class Logic {
      greeter = inject(Greeter);
    }

    const Comp = () => {
      const logic = useLogic(Logic);
      return <span data-testid="v">{logic.greeter.greet()}</span>;
    };

    render(
      <Injector provide={[{ provide: Greeter, useClass: LoudGreeter }]}>
        <Comp />
      </Injector>
    );
    expect(screen.getByTestId('v').textContent).toBe('HELLO');
  });

  it('useValue supplies a primitive via an InjectionToken', () => {
    const API_URL = new InjectionToken<string>('API_URL');
    class Logic {
      url = inject(API_URL);
    }

    const Comp = () => {
      const logic = useLogic(Logic);
      return <span data-testid="v">{logic.url}</span>;
    };

    render(
      <Injector provide={[{ provide: API_URL, useValue: 'https://api.test' }]}>
        <Comp />
      </Injector>
    );
    expect(screen.getByTestId('v').textContent).toBe('https://api.test');
  });

  it('useFactory runs the factory once and shares the result across consumers', () => {
    const TOKEN = new InjectionToken<{ id: number }>('OBJ');
    const factory = vi.fn(() => ({ id: 42 }));

    class Logic {
      obj = inject(TOKEN);
    }

    const Comp = ({ id }: { id: string }) => {
      const logic = useLogic(Logic);
      return <span data-testid={id}>{logic.obj.id}</span>;
    };

    render(
      <Injector provide={[{ provide: TOKEN, useFactory: factory }]}>
        <Comp id="a" />
        <Comp id="b" />
      </Injector>
    );

    expect(screen.getByTestId('a').textContent).toBe('42');
    expect(screen.getByTestId('b').textContent).toBe('42');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('a nested Injector overrides a parent provider', () => {
    const TOKEN = new InjectionToken<string>('LEVEL');
    class Logic {
      level = inject(TOKEN);
    }

    const Comp = () => {
      const logic = useLogic(Logic);
      return <span data-testid="v">{logic.level}</span>;
    };

    render(
      <Injector provide={[{ provide: TOKEN, useValue: 'parent' }]}>
        <Injector provide={[{ provide: TOKEN, useValue: 'child' }]}>
          <Comp />
        </Injector>
      </Injector>
    );
    expect(screen.getByTestId('v').textContent).toBe('child');
  });

  it('optional inject returns null when the token is not provided', () => {
    const MISSING = new InjectionToken<string>('MISSING');
    class Logic {
      maybe = inject(MISSING, { optional: true });
    }

    const Comp = () => {
      const logic = useLogic(Logic);
      return <span data-testid="v">{logic.maybe === null ? 'null' : logic.maybe}</span>;
    };

    render(<Comp />);
    expect(screen.getByTestId('v').textContent).toBe('null');
  });

  it('disposes a service when its Injector host unmounts', () => {
    const cleanup = vi.fn();
    class ScopedService {
      constructor() {
        onDestroy(cleanup);
      }
    }
    class Logic {
      svc = inject(ScopedService);
    }

    const Comp = () => {
      useLogic(Logic);
      return null;
    };

    const { unmount } = render(
      <Injector provide={[{ provide: ScopedService, useClass: ScopedService }]}>
        <Comp />
      </Injector>
    );
    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('keeps an injected service alive when its consuming logic class is destroyed', () => {
    const cleanup = vi.fn();
    class ScopedService {
      n = state(0);
      constructor() {
        onDestroy(cleanup);
      }
    }
    class Logic {
      svc = inject(ScopedService);
    }

    const Child = () => {
      useLogic(Logic);
      return null;
    };
    const Host = ({ show }: { show: boolean }) => (
      <Injector provide={[{ provide: ScopedService, useClass: ScopedService }]}>
        {show && <Child />}
      </Injector>
    );

    const { rerender, unmount } = render(<Host show={true} />);
    rerender(<Host show={false} />);
    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('disposing a child Injector does not affect a parent-cached service', () => {
    const childCleanup = vi.fn();
    const parentCleanup = vi.fn();

    class ParentService {
      constructor() {
        onDestroy(parentCleanup);
      }
    }
    class ChildService {
      constructor() {
        onDestroy(childCleanup);
      }
    }
    class Logic {
      parent = inject(ParentService);
      child = inject(ChildService);
    }

    const Inner = () => {
      useLogic(Logic);
      return null;
    };

    const Tree = ({ showChild }: { showChild: boolean }) => (
      <Injector provide={[{ provide: ParentService, useClass: ParentService }]}>
        {showChild && (
          <Injector provide={[{ provide: ChildService, useClass: ChildService }]}>
            <Inner />
          </Injector>
        )}
      </Injector>
    );

    const { rerender, unmount } = render(<Tree showChild={true} />);
    rerender(<Tree showChild={false} />);
    expect(childCleanup).toHaveBeenCalledOnce();
    expect(parentCleanup).not.toHaveBeenCalled();

    unmount();
    expect(parentCleanup).toHaveBeenCalledOnce();
  });

  it('isolates effect lifetimes: logic effect dies with logic, service effect dies with Injector', async () => {
    const serviceLog: number[] = [];
    const logicLog: number[] = [];

    class CounterService {
      count = state(0);
      constructor() {
        effect(() => {
          serviceLog.push(this.count());
        });
      }
    }

    class Logic {
      svc = inject(CounterService);
      constructor() {
        effect(() => {
          logicLog.push(this.svc.count());
        });
      }
    }

    let serviceRef!: CounterService;
    const Child = () => {
      const logic = useLogic(Logic);
      serviceRef = logic.svc;
      return null;
    };

    const Host = ({ showChild }: { showChild: boolean }) => (
      <Injector provide={[{ provide: CounterService, useClass: CounterService }]}>
        {showChild && <Child />}
      </Injector>
    );

    const { rerender, unmount } = render(<Host showChild={true} />);

    // Both effects ran on construction, observing the initial 0.
    expect(serviceLog).toEqual([0]);
    expect(logicLog).toEqual([0]);

    // A signal mutation reaches both effects.
    await act(async () => {
      serviceRef.count(1);
      await tick();
    });
    expect(serviceLog).toEqual([0, 1]);
    expect(logicLog).toEqual([0, 1]);

    // Unmount the consumer. The Injector stays mounted, so the service —
    // and its effect — should survive.
    rerender(<Host showChild={false} />);

    await act(async () => {
      serviceRef.count(2);
      await tick();
    });
    expect(serviceLog).toEqual([0, 1, 2]);
    // Logic's effect was tied to the consumer's lifetime; it must be silent.
    expect(logicLog).toEqual([0, 1]);

    // Tearing down the Injector kills the service's effect too.
    unmount();
    await act(async () => {
      serviceRef.count(3);
      await tick();
    });
    expect(serviceLog).toEqual([0, 1, 2]);
    expect(logicLog).toEqual([0, 1]);
  });
});

describe('useLogic — onDestroy', () => {
  it('runs onDestroy callbacks registered in the logic class on unmount', () => {
    const cb = vi.fn();
    class Logic {
      constructor() {
        onDestroy(cb);
      }
    }
    const Comp = () => {
      useLogic(Logic);
      return null;
    };

    const { unmount } = render(<Comp />);
    expect(cb).not.toHaveBeenCalled();
    unmount();
    expect(cb).toHaveBeenCalledOnce();
  });

  it('does not leak onDestroy from a constructor across separate mounts', () => {
    const cb = vi.fn();
    class Logic {
      constructor() {
        onDestroy(cb);
      }
    }
    const Comp = () => {
      useLogic(Logic);
      return null;
    };

    const a = render(<Comp />);
    const b = render(<Comp />);
    a.unmount();
    expect(cb).toHaveBeenCalledTimes(1);
    b.unmount();
    expect(cb).toHaveBeenCalledTimes(2);
  });
});

describe('useLogic — auto-tracked effects', () => {
  it('disposes effect() created in the constructor on unmount', async () => {
    const seen: number[] = [];
    class Logic {
      n = state(0);
      constructor() {
        effect(() => {
          seen.push(this.n());
        });
      }
    }

    let r!: Logic;
    const Comp = () => {
      r = useLogic(Logic);
      return null;
    };

    const { unmount } = render(<Comp />);
    expect(seen).toEqual([0]);

    await act(async () => {
      r.n(1);
      await tick();
    });
    expect(seen).toEqual([0, 1]);

    unmount();

    // After unmount, mutating the signal must not invoke the effect.
    r.n(2);
    await awaitTimeout(0);
    expect(seen).toEqual([0, 1]);
  });

  it('runs the effect cleanup on unmount', async () => {
    const cleanup = vi.fn();
    class Logic {
      constructor() {
        effect(() => cleanup);
      }
    }
    const Comp = () => {
      useLogic(Logic);
      return null;
    };

    const { unmount } = render(<Comp />);
    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('runs the cleanup before each re-run inside a logic class', async () => {
    const events: string[] = [];
    class Logic {
      n = state(0);
      constructor() {
        effect(() => {
          const v = this.n();
          events.push(`run:${v}`);
          return () => events.push(`cleanup:${v}`);
        });
      }
    }
    let r!: Logic;
    const Comp = () => {
      r = useLogic(Logic);
      return null;
    };

    const { unmount } = render(<Comp />);
    expect(events).toEqual(['run:0']);

    await act(async () => {
      r.n(1);
      await tick();
    });
    expect(events).toEqual(['run:0', 'cleanup:0', 'run:1']);

    unmount();
    expect(events.at(-1)).toBe('cleanup:1');
  });
});

describe('useLogic — cleanup callback', () => {
  it('calls the user-provided cleanup with the instance on unmount', () => {
    class Logic {
      tag = 'logic';
    }
    const cleanup = vi.fn();
    const Comp = () => {
      useLogic(Logic, cleanup);
      return null;
    };
    const { unmount } = render(<Comp />);
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(cleanup.mock.calls[0][0]).toBeInstanceOf(Logic);
  });
});

describe('useLogic — independent instances', () => {
  it('each useLogic call gets its own logic instance with its own state', async () => {
    class Counter {
      count = state(0);
      inc() {
        this.count(this.count() + 1);
      }
    }

    const refs: Counter[] = [];
    const Comp = ({ id }: { id: string }) => {
      const l = useLogic(Counter);
      refs.push(l);
      return <span data-testid={id}>{l.count()}</span>;
    };

    render(
      <>
        <Comp id="a" />
        <Comp id="b" />
      </>
    );

    expect(refs[0]).not.toBe(refs[1]);

    await act(async () => {
      refs[0].inc();
      await tick();
    });

    expect(screen.getByTestId('a').textContent).toBe('1');
    expect(screen.getByTestId('b').textContent).toBe('0');
  });
});
