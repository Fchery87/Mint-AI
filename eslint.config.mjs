import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',
    },
  },
  {
    // Allow console in development files
    files: ['**/*.dev.ts', '**/*.development.ts'],
    rules: {
      'no-console': 'off',
    },
  }
);
