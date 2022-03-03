import { defineConfig } from 'rollup';
import resolve from 'rollup-plugin-node-resolve';

export default defineConfig({
  input: 'src/index.js',
  output: {
    file: './dist/hyperion.js',
    format: 'es',
    name: 'hyperion',
    intro: `
/**
 * Copyright (c) Meta Platforms, Inc. and its affiliates. All Rights Reserved.
 *
 * This file is @generated from the Hyperion project hosted on
 * https://github.com/facebookincubator/hyperion
 *
 */

    `,
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