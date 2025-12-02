const {
    defineConfig,
} = require('eslint/config');

const globals = require('globals');
const js = require('@eslint/js');

const {
    FlatCompat,
} = require('@eslint/eslintrc');

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.mocha,
        },

        ecmaVersion: 2020,
        parserOptions: {},
    },

    extends: compat.extends('eslint:recommended'),

    rules: {
        'indent': ['error', 4],
        'no-console': 'off',

        'no-unused-vars': ['error', {
            'ignoreRestSiblings': true,
            'argsIgnorePattern': '^_',
        }],

        'no-trailing-spaces': 'error',
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
    },
}]);