import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * ESLint — deliberately narrow.
 *
 * This exists for exactly one bug class. `npm run lint` was `tsc --noEmit`, and a
 * React hook called below an early return is a perfectly type-correct program, so
 * the typecheck could never see it. That fault has shipped three times:
 *
 *   c53ae74   a hook under an early return blanked a live client page
 *   b/f 2026-08-29  ProductsBlock, same shape, caught in review
 *   2026-08-30  the booking FAB in SiteRenderer, same shape again — and it
 *               passed the typecheck, six smoke suites and a production build
 *
 * Three times through a green gate is a gate problem, not an author problem.
 * `rules-of-hooks` is an error and should stay one.
 *
 * Everything else here is a warning on purpose. The goal is to stop a specific
 * recurring defect, not to open a codebase-wide style cleanup — a config that
 * prints four hundred findings on day one gets ignored by day two, and then it
 * is not catching the hooks bug either.
 *
 * eslint-plugin-react-hooks v7 also ships the React Compiler rules (purity,
 * memoization, effect dependencies). They are not enabled. Turn them on
 * deliberately, one at a time, when there is appetite for what they find.
 */

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/templates/**',
      'brand-assets/**',
      '**/*.cjs',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [tseslint.configs.base],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // The whole reason this file exists.
      'react-hooks/rules-of-hooks': 'error',

      // A stale closure over props is a real bug, but the fix is sometimes a
      // judgement call and sometimes intentional. Loud, not blocking.
      'react-hooks/exhaustive-deps': 'warn',
    },
  }
);
