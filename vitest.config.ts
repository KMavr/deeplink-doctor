import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit (pure core) and integration (adapters) tests live side by side
    // under tests/, but stay in separate subtrees by convention.
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
