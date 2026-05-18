import { state } from '@react-logic/react-logic';
import {
  email,
  formGroup,
  formState,
  type FormValues,
  integer,
  max,
  maxLength,
  min,
  minLength,
  oneOf,
  pattern,
  required,
} from '@react-logic/utils';

/**
 * A signup form covering every supported input kind, validators (built-in
 * and custom), nested groups, and the `Form.inputs` sugar. The submit
 * handler captures the typed values on a sibling signal so we can echo
 * them back on the page.
 */
export class SignupLogic {
  form = formState({
    name: { validators: [required(), minLength(2), maxLength(40)] },
    email: { validators: [required(), email()] },
    password: {
      validators: [
        required(),
        minLength(8),
        // Two pattern checks on the same field — give each its own name
        // so they don't collide in the keyed errors map.
        pattern(/[A-Z]/, 'At least one uppercase', 'uppercase'),
        pattern(/\d/, 'At least one digit', 'digit'),
      ],
    },
    age: {
      initial: 18,
      parse: Number,
      validators: [required(), min(18), max(120), integer()],
    },
    country: {
      initial: '' as '' | 'US' | 'UK' | 'CA',
      kind: 'select' as const,
      validators: [oneOf(['US', 'UK', 'CA'] as const, 'Choose a country')],
    },
    agree: {
      kind: 'checkbox' as const,
      validators: [required('You must agree')],
    },
    address: formGroup({
      street: { validators: [required()] },
      city: { validators: [required()] },
      zip: {
        validators: [
          required(),
          pattern(/^\d{5}$/, 'Five digits'),
        ],
      },
    }),
  });

  submitted = state<FormValues<SignupLogic['form']> | null>(null);

  submit(values: FormValues<typeof this.form>) {
    this.submitted(values);
  }
}
