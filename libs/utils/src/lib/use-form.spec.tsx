import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { formGroup, formState } from './forms';
import { required } from './forms-validators';
import { useForm } from './use-form';

describe('useForm — bind proxy', () => {
  it('spreads bind props into an <input>; typing updates the form value', () => {
    const form = formState({ email: {} });
    const App = () => {
      const Form = useForm(form);
      return (
        <Form onSubmit={() => undefined}>
          <input data-testid="email" {...Form.bind.email} />
        </Form>
      );
    };
    render(<App />);
    const input = screen.getByTestId('email') as HTMLInputElement;
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { value: 'a@b.co' } });
    expect(form().values.email).toBe('a@b.co');
  });

  it('checkbox bind reads/writes `checked` and sets type="checkbox"', () => {
    const form = formState({ agree: { kind: 'checkbox' as const } });
    const App = () => {
      const Form = useForm(form);
      return (
        <Form onSubmit={() => undefined}>
          <input data-testid="agree" {...Form.bind.agree} />
        </Form>
      );
    };
    render(<App />);
    const cb = screen.getByTestId('agree') as HTMLInputElement;
    expect(cb.type).toBe('checkbox');
    expect(cb.checked).toBe(false);
    fireEvent.click(cb);
    expect(form().values.agree).toBe(true);
  });

  it('nested-group bind: typing into address.city updates the snapshot', () => {
    const form = formState({
      address: formGroup({ city: {} }),
    });
    const App = () => {
      const Form = useForm(form);
      return (
        <Form onSubmit={() => undefined}>
          <input data-testid="city" {...Form.bind.address.city} />
        </Form>
      );
    };
    render(<App />);
    fireEvent.change(screen.getByTestId('city'), {
      target: { value: 'Tel Aviv' },
    });
    expect(form().values.address.city).toBe('Tel Aviv');
  });
});

describe('useForm — Form.inputs sugar', () => {
  it('renders an <input> per text field with bind props attached', () => {
    const form = formState({ email: {} });
    const App = () => {
      const Form = useForm(form);
      return (
        <Form onSubmit={() => undefined}>
          <Form.inputs.email data-testid="email" placeholder="Email" />
        </Form>
      );
    };
    render(<App />);
    const input = screen.getByTestId('email') as HTMLInputElement;
    expect(input.placeholder).toBe('Email');
    expect(input.name).toBe('email');
    fireEvent.change(input, { target: { value: 'a@b.co' } });
    expect(form().values.email).toBe('a@b.co');
  });

  it('renders a <select> for kind=select and writes onChange through', () => {
    const form = formState({
      country: { kind: 'select' as const, initial: 'US' },
    });
    const App = () => {
      const Form = useForm(form);
      return (
        <Form onSubmit={() => undefined}>
          <Form.inputs.country data-testid="country">
            <option value="US">US</option>
            <option value="UK">UK</option>
          </Form.inputs.country>
        </Form>
      );
    };
    render(<App />);
    const select = screen.getByTestId('country') as HTMLSelectElement;
    expect(select.value).toBe('US');
    fireEvent.change(select, { target: { value: 'UK' } });
    expect(form().values.country).toBe('UK');
  });

  it('renders a checkbox input with type="checkbox"', () => {
    const form = formState({ agree: { kind: 'checkbox' as const } });
    const App = () => {
      const Form = useForm(form);
      return (
        <Form onSubmit={() => undefined}>
          <Form.inputs.agree data-testid="agree" />
        </Form>
      );
    };
    render(<App />);
    const cb = screen.getByTestId('agree') as HTMLInputElement;
    expect(cb.type).toBe('checkbox');
    fireEvent.click(cb);
    expect(form().values.agree).toBe(true);
  });

  it('input components have a stable identity per field across renders', () => {
    const form = formState({ name: {} });
    const seenComponents: unknown[] = [];
    const App = () => {
      const Form = useForm(form);
      seenComponents.push(Form.inputs.name);
      return (
        <Form onSubmit={() => undefined}>
          <Form.inputs.name data-testid="name" />
        </Form>
      );
    };
    const { rerender } = render(<App />);
    rerender(<App />);
    rerender(<App />);
    expect(seenComponents[0]).toBe(seenComponents[1]);
    expect(seenComponents[1]).toBe(seenComponents[2]);
  });

  it('non-reactive user props pass through (className, placeholder, …)', () => {
    const form = formState({ email: {} });
    const App = () => {
      const Form = useForm(form);
      return (
        <Form onSubmit={() => undefined}>
          <Form.inputs.email
            data-testid="email"
            className="custom"
            placeholder="Type here"
          />
        </Form>
      );
    };
    render(<App />);
    const input = screen.getByTestId('email') as HTMLInputElement;
    expect(input.className).toBe('custom');
    expect(input.placeholder).toBe('Type here');
    expect(input.name).toBe('email');
  });

  it('reactive props are not in the prop surface (TS prevents passing them)', () => {
    const form = formState({ email: {} });
    const onChangeUser = vi.fn();
    const App = () => {
      const Form = useForm(form);
      // Cast to bypass TS — verifying the runtime fallback if someone
      // does this from JS or with `as any`.
      const Input = Form.inputs.email as unknown as React.FC<
        Record<string, unknown>
      >;
      return (
        <Form onSubmit={() => undefined}>
          <Input
            data-testid="email"
            onChange={onChangeUser}
            name="should-not-stick"
          />
        </Form>
      );
    };
    render(<App />);
    const input = screen.getByTestId('email') as HTMLInputElement;
    // Bind always wins on reactive props at runtime, regardless of casts.
    expect(input.name).toBe('email');
    fireEvent.change(input, { target: { value: 'x' } });
    expect(form().values.email).toBe('x');
    expect(onChangeUser).not.toHaveBeenCalled();
  });
});

describe('useForm — submit flow', () => {
  it('calls onSubmit with typed values when valid; marks touched otherwise', () => {
    const form = formState({
      email: { validators: [required()] },
    });
    const onSubmit = vi.fn();
    const App = () => {
      const Form = useForm(form);
      return (
        <Form onSubmit={onSubmit}>
          <Form.inputs.email data-testid="email" />
          <button type="submit" data-testid="submit">go</button>
        </Form>
      );
    };
    render(<App />);

    // Invalid submit — handler not called, touched flips true.
    act(() => {
      fireEvent.click(screen.getByTestId('submit'));
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(form().touched.email).toBe(true);

    // Fill the field and submit again — handler called with typed values.
    fireEvent.change(screen.getByTestId('email'), {
      target: { value: 'a@b.co' },
    });
    act(() => {
      fireEvent.click(screen.getByTestId('submit'));
    });
    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.co' });
  });

  it('renders <form noValidate> by default', () => {
    const form = formState({ name: {} });
    const App = () => {
      const Form = useForm(form);
      return (
        <Form onSubmit={() => undefined} data-testid="form">
          <Form.inputs.name />
        </Form>
      );
    };
    render(<App />);
    const formEl = screen.getByTestId('form') as HTMLFormElement;
    expect(formEl.noValidate).toBe(true);
  });
});
