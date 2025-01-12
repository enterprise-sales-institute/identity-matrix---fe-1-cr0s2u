module.exports = {
  // Use TypeScript parser for ESLint
  parser: '@typescript-eslint/parser', // @typescript-eslint/parser ^5.59.0

  // Parser options for TypeScript and ES2022
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },

  // Extended configurations
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // @typescript-eslint/eslint-plugin ^5.59.0
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/errors', // eslint-plugin-import ^2.27.5
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier' // eslint-config-prettier ^8.8.0
  ],

  // ESLint plugins
  plugins: [
    '@typescript-eslint', // @typescript-eslint/eslint-plugin ^5.59.0
    'import', // eslint-plugin-import ^2.27.5
    'prettier' // eslint-plugin-prettier ^4.2.1
  ],

  // Environment configuration
  env: {
    node: true,
    es2022: true,
    jest: true
  },

  // Custom rule configurations
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',

    // TypeScript-specific rules
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_'
    }],
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',

    // Import rules
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      'alphabetize': {
        'order': 'asc'
      }
    }],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-unused-modules': 'error',

    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'off' // Turned off in favor of @typescript-eslint/no-unused-vars
  },

  // Settings for import resolution
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  },

  // Files to ignore
  ignorePatterns: [
    'dist',
    'coverage',
    'node_modules',
    '**/*.js',
    '**/*.d.ts'
  ]
};