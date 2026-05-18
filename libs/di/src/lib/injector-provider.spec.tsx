import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Injector, useInjector } from './injector-provider';
import { InjectionToken } from './injection-token';

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

describe('Injector / useInjector', () => {
  it('useInjector resolves a value provided by Injector', () => {
    const TOKEN = new InjectionToken<string>('GREETING');
    const Child = () => <span>{useInjector(TOKEN)}</span>;
    render(
      <Injector provide={[{ provide: TOKEN, useValue: 'hi' }]}>
        <Child />
      </Injector>
    );
    expect(screen.getByText('hi')).toBeTruthy();
  });

  it('child Injector overrides parent provider', () => {
    const TOKEN = new InjectionToken<string>('LEVEL');
    const Child = () => <span>{useInjector(TOKEN)}</span>;
    render(
      <Injector provide={[{ provide: TOKEN, useValue: 'parent' }]}>
        <Injector provide={[{ provide: TOKEN, useValue: 'child' }]}>
          <Child />
        </Injector>
      </Injector>
    );
    expect(screen.getByText('child')).toBeTruthy();
  });

  it('returns null for an optional missing token', () => {
    const TOKEN = new InjectionToken<string>('MISSING');
    const Child = () => {
      const value: string | null = useInjector(TOKEN, true);
      return <span>{value === null ? 'null' : value}</span>;
    };
    render(<Child />);
    expect(screen.getByText('null')).toBeTruthy();
  });

  it('non-optional useInjector returns a non-null type', () => {
    class Service {
      label = 'present';
    }
    const Child = () => {
      // No `!`, no `| null` — overload should resolve to T directly.
      const svc: Service = useInjector(Service);
      return <span>{svc.label}</span>;
    };
    render(
      <Injector provide={[Service]}>
        <Child />
      </Injector>
    );
    expect(screen.getByText('present')).toBeTruthy();
  });

  it('passing through Injector with no providers preserves the parent context', () => {
    const TOKEN = new InjectionToken<string>('FROM_PARENT');
    const Child = () => <span>{useInjector(TOKEN)}</span>;
    render(
      <Injector provide={[{ provide: TOKEN, useValue: 'parent' }]}>
        <Injector>
          <Child />
        </Injector>
      </Injector>
    );
    expect(screen.getByText('parent')).toBeTruthy();
  });

  it('accepts a bare class as shorthand for { provide: C, useClass: C }', () => {
    class Greeter {
      greet() {
        return 'hi from greeter';
      }
    }
    const Child = () => {
      const g = useInjector(Greeter);
      return <span>{g.greet()}</span>;
    };
    render(
      <Injector provide={[Greeter]}>
        <Child />
      </Injector>
    );
    expect(screen.getByText('hi from greeter')).toBeTruthy();
  });

  it('mixes bare classes and full provider objects in the same array', () => {
    class Greeter {
      greet() {
        return 'hello';
      }
    }
    const TOKEN = new InjectionToken<string>('SUFFIX');
    const Child = () => {
      const g = useInjector(Greeter);
      const suffix = useInjector(TOKEN);
      return <span>{`${g.greet()} ${suffix}`}</span>;
    };
    render(
      <Injector provide={[Greeter, { provide: TOKEN, useValue: 'world' }]}>
        <Child />
      </Injector>
    );
    expect(screen.getByText('hello world')).toBeTruthy();
  });
});
