import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';
export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // `Form.inputs.<fieldName>` is the documented sugar. Field names are
      // camelCase, so dot-segments after the root are lowercase — which
      // the PascalCase rule flags. Disable for this app; the typed-path
      // ergonomics are the point.
      'react/jsx-pascal-case': 'off',
    },
  },
];
