import { defineConfig } from 'vitest/config';

// Firestore SECURITY-RULES tests run against the emulator, in Node (not jsdom).
// Launch via: npm run test:rules  (wraps `firebase emulators:exec`).
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 20000,
    hookTimeout: 40000,
    fileParallelism: false,
  },
});
