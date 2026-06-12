import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit (pure core) and integration (adapters) tests live side by side
    // under test/, but stay in separate subtrees by convention.
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
