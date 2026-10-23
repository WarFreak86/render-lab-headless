import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [
    {
      name: 'test-server-build',
      resolveId(id) {
        if (id === 'virtual:react-router/server-build') return `\0${id}`;
      },
      load(id) {
        if (id === '\0virtual:react-router/server-build') return 'export {};';
      },
    },
  ],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./app/test/setup.ts'],
    css: true,
  },
});
