import { defineConfig } from 'tsup';

export default defineConfig([
  // Native build (Host App - React Native)
  {
    entry: {
      index: 'src/index.native.ts',
    },
    outDir: 'dist/native',
    format: ['cjs', 'esm'],
    dts: false,
    clean: true,
    external: ['react', 'react-native', 'rill'],
    esbuildOptions(options) {
      options.conditions = ['react-native'];
    },
  },
  // Remote build (Guest - QuickJS/Sandbox)
  {
    entry: {
      index: 'src/index.remote.ts',
    },
    outDir: 'dist/remote',
    format: ['cjs', 'esm'],
    dts: false,
    clean: false,
    external: ['react', 'rill'],
  },
  // Core build (Host Only - Registry & Bridge)
  {
    entry: {
      index: 'src/core/index.ts',
    },
    outDir: 'dist/core',
    format: ['cjs', 'esm'],
    dts: false,
    clean: false,
    external: ['react', 'react-native', 'rill'],
  },
  // Types (shared declaration files)
  {
    entry: {
      'index': 'src/index.native.ts',
      'core/index': 'src/core/index.ts',
    },
    outDir: 'dist/types',
    dts: {
      only: true,
    },
    clean: false,
    external: ['react', 'react-native', 'rill'],
  },
]);
