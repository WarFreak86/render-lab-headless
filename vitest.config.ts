import {fileURLToPath} from 'node:url';
import {configDefaults, defineConfig} from 'vitest/config';

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
    // Each standalone package owns a Node test config; Hydrogen owns jsdom tests.
    exclude: [...configDefaults.exclude, 'prototypes/**'],
    maxWorkers: 2,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./app/test/setup.ts'],
    css: true,
  },
});
