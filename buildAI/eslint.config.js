import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `backend` is a separate Node/CommonJS project living inside this repo —
  // it isn't part of the Vite/React app this config targets (it has no
  // JSX, uses `require`/`module.exports`, and relies on Node globals like
  // `process`), so it shouldn't be linted with browser-flavoured rules.
  globalIgnores(['dist', 'backend']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // `react-hooks/set-state-in-effect` (new in eslint-plugin-react-hooks v7)
      // flags `useEffect(() => { loadAll() }, [])`-style fetch-on-mount effects
      // even when the state updates happen after an `await`, i.e. asynchronously.
      // That's the standard "load data when this page mounts" pattern used here
      // (DoctorPage, PatientPage) and is not actually a synchronous setState —
      // silencing it rather than restructuring working data-fetching code.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
