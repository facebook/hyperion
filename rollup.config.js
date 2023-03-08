import { defineConfig } from 'rollup';
import resolve from 'rollup-plugin-node-resolve';
import md5 from 'md5';

export default defineConfig({
  input: 'src/index.js',
  output: {
    // file: './dist/hyperion.js',
    dir: './dist',
    manualChunks: {
      "hyperionCore": [
        "@hyperion/hyperion-core/src/FunctionInterceptor",
        "@hyperion/hyperion-core/src/ConstructorInterceptor",
        "@hyperion/hyperion-core/src/AttributeInterceptor",
        "@hyperion/hyperion-core/src/intercept",
        "@hyperion/hyperion-dom/src/INode",
        "@hyperion/hyperion-dom/src/IElement_",
      ],
      "hyperionTrackElementsWithAttributes": [
        "@hyperion/hyperion-dom/src/IElement",
        "@hyperion/hyperion-util/src/trackElementsWithAttributes",
      ],
      "hyperionSyncMutationObserver": [
        "@hyperion/hyperion-util/src/SyncMutationObserver",
      ],
      "hyperionOnNetworkRequest": [
        "@hyperion/hyperion-dom/src/IWindow",
        "@hyperion/hyperion-dom/src/IXMLHttpRequest",
        "@hyperion/hyperion-util/src/onNetworkRequest",
      ],
      "hyperionFlowletCore": [
        "@hyperion/hyperion-flowlet/src/Flowlet",
        "@hyperion/hyperion-flowlet/src/FlowletManager",
      ],
      "hyperionFlowlet": [
        "@hyperion/hyperion-flowlet/src/Index",
      ],
      "hyperionReact": [
        "@hyperion/hyperion-react/src/IRequire",
        "@hyperion/hyperion-react/src/IReact",
        "@hyperion/hyperion-react/src/IReactDOM",
      ],
      "hyperionAutoLogging": [
        "@hyperion/hook/src/Channel",
        "@hyperion/hyperion-autologging/src/ALFlowletManager",
        "@hyperion/hyperion-autologging/src/ALSurface",
        "@hyperion/hyperion-autologging/src/ALSurfaceContext",
        "@hyperion/hyperion-autologging/src/ALEventIndex",
        "@hyperion/hyperion-autologging/src/ALInteractableDOMElement",
        "@hyperion/hyperion-autologging/src/AutoLogging",
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
 * - <copy the 'hyperion/dist/' folder
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