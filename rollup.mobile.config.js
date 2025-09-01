import { defineConfig } from 'rollup';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import md5 from 'md5';

export default defineConfig({
  input: 'src/index.mobile.js',
  external: [
    /cytoscape/,
    "react",
  ],
  output: {
    // file: './dist/hyperion.js',
    dir: './dist_mobile',
    manualChunks: {
      "hyperionMobileChannel": [
        "hyperion-channel/src/Channel",
        "hyperion-channel/src/index",
      ],
      "hyperionMobileTestAndSet": [
        "hyperion-test-and-set/src/TestAndSet",
        "hyperion-test-and-set/src/index",
      ],
      "hyperionMobileCore": [
        "hyperion-core/src/FunctionInterceptor",
        "hyperion-core/src/ConstructorInterceptor",
        "hyperion-core/src/AttributeInterceptor",
        "hyperion-core/src/intercept",
        "hyperion-core/src/IRequire",
        "hyperion-core/src/IPromise",
        "hyperion-core/src/IGlobalThis",
        "hyperion-core/src/index",
      ],
      "hyperionMobileTrackElementsWithAttributes": [
        "hyperion-util/src/trackElementsWithAttributes",
      ],
      "hyperionMobileSyncMutationObserver": [
        "hyperion-util/src/SyncMutationObserver",
      ],
      "hyperionMobileUtil": [
        "hyperion-util/src/ClientSessionID",
        "hyperion-util/src/PersistentData",
        "hyperion-util/src/index",
      ],
      "hyperionMobileReact": [
        "hyperion-react/src/IReact",
        "hyperion-react/src/IReactComponent",
        "hyperion-react/src/index",
      ],
      "hyperionMobileReactNative": [
        "hyperion-react-native/src/ALComponentPropPublisher",
        "hyperion-react-native/src/ALSurfacePublisher",
        "hyperion-react-native/src/AutoLogging",
        "hyperion-react-native/src/index",
      ]
    },
    chunkFileNames: "[name].js",
    minifyInternalExports: false,
    /////////////////////////////////////////////////////////////////
    format: 'es',
    name: 'hyperion',
    intro: `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * This file is auto generated from the Hyperion project hosted on
 * https://github.com/facebookincubator/hyperion
 * Instead of changing this file, you should:
 * - git clone https://github.com/facebookincubator/hyperion
 * - npm install
 * - npm run install-packages
 * - <make necessary modifications>
 * - npm run build
 * - npm test
 * - <copy the 'hyperion/dist/' folder>
 * - e.g. 'scp -r  ./dist/hyperion* $USER@my-od.facebook.com:www/html/js/hyperion/dist/'
 *
 * @generated <<SignedSource::08411d9f4a630be70617b13b3a5bcc0e>>
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
    commonjs(),
    resolve({
      // // main: false,
      // mainFields: ['name', 'module', 'main'],
      // customResolveOptions: {
      //   moduleDirectory: [
      //     "./packages/hyperion-devtools",
      //     "./packages/hyperion-global",
      //     "./packages/hook",
      //     "./packages/hyperion-core",
      //     "./packages/hyperion-dom",
      //     "./packages/hyperion-util"
      //   ]
      // }
    }),
    {
      generateBundle: (options, bundle, isWrite) => {
        for (let bundleName in bundle) {
          const b = bundle[bundleName];
          if (typeof b.code === "string") {
            const signature = md5(b.code);
            b.code = b.code
              .replace(/@generated <<SignedSource::[^>]+>>/, `@generated <<SignedSource::${signature}>>`)
              .replace(/(import [^']*from ')[.]\/([^.]+)[.]js(';)/g, `$1$2$3`)
              .replace(/\n(intercept(?:Function|Method|Attribute|Constructor|ConstructorMethod|ElementAttribute|EventHandlerAttribute)\([^\)]+\);)/g, "\n//$1")
              ;
          }
        }
      }
    }
  ],
  treeshake: "smallest"
})
