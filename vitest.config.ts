import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig({
  ...viteConfig,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    watch: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'dist/',
        'coverage/',
        '**/__tests__/**',
        '**/*.test.{js,ts,tsx}',
        '**/*.spec.{js,ts,tsx}',
        'src/components/ui/**', // UI components are mostly style-focused
      ],
      include: [
        'src/**/*.{js,ts,tsx}',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
