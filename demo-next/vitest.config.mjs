import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        statements: 50,
        branches: 45,
        functions: 40,
        lines: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@contracts': resolve(__dirname, '../out'),
    },
  },
});
