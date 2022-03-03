import { defineConfig } from 'rollup';
import resolve from 'rollup-plugin-node-resolve';

export default defineConfig({
  input: 'src/index.js',
  output: {
    file: './dist/hyperion.js',
    format: 'es',
    name: 'hyperion',
    generatedCode: {
      preset: 'es2015',
      preferConst: true,
      constBindings: true,
      symbols: false, // use of Symobl
    }
  },
  // preserveSymlinks: true,
  plugins: [
    resolve({
      // // main: false,
      // mainFields: ['name', 'module', 'main'],
      // customResolveOptions: {
      //   moduleDirectory: [
      //     "./packages/devtools",
      //     "./packages/global",
      //     "./packages/hook",
      //     "./packages/hyperion-core",
      //     "./packages/hyperion-dom",
      //     "./packages/hyperion-util"
      //   ]
      // }
    })
  ]
})