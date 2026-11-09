import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['{src,shared,worker}/**/*.test.{ts,tsx}'],
  },
});
