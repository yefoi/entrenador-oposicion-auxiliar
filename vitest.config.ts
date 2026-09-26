import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Splitting the environments is worth about 5 seconds per run.
 *
 * Twenty-two files shared one jsdom setup that took 44s of tracked time, three
 * quarters of the whole suite, and fourteen of those files never touch the DOM.
 * They test scoring, sessions, the review ladder and the question bank, all of
 * which are plain functions.
 *
 * Splitting by project rather than by a `@vitest-environment` docblock in each
 * file means a new test lands in the right environment by matching a glob,
 * instead of relying on whoever writes it to remember the comment.
 */
const soloLogica = [
  'src/lib/adaptive.test.ts',
  'src/lib/mastery.test.ts',
  'src/lib/minigames.test.ts',
  'src/lib/minigames.speedrun.test.ts',
  'src/lib/question-quality.audit.test.ts',
  'src/lib/question-quality.test.ts',
  'src/lib/regrade.test.ts',
  'src/lib/scoring.test.ts',
  'src/lib/search.test.ts',
  'src/lib/session.test.ts',
  'src/lib/validation.test.ts',
  'src/data/questions/normalize.test.ts',
  'src/components/Icons.test.ts',
]

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'logica',
          environment: 'node',
          include: soloLogica,
          // jest-dom aporta matchers de DOM y arrastra sus propios type-tests,
          // que no empaquetan fuera de jsdom. Los tests de logica no los usan.
          setupFiles: [],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          exclude: soloLogica,
        },
      },
    ],
  },
})
