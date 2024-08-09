import { defineConfig } from 'rollup';
import resolve from 'rollup-plugin-node-resolve';
import md5 from 'md5';

export default defineConfig({
  input: 'src/index.js',
  external: [
    /cytoscape/,
    "react",
  ],
  output: {
    // file: './dist/hyperion.js',
    dir: './dist',
    manualChunks: {
      "hyperionHook": [
        "@hyperion/hyperion-hook/src/Hook",
      ],
      "hyperionChannel": [
        "@hyperion/hyperion-channel/src/Channel",
      ],
      "hyperionAsyncCounter": [
        "@hyperion/hyperion-async-counter/src/AsyncCounter",
      ],
      "hyperionTimedTrigger": [
        "@hyperion/hyperion-timed-trigger/src/TimedTrigger",
      ],
      "hyperionTestAndSet": [
        "@hyperion/hyperion-test-and-set/src/TestAndSet",
      ],
      "hyperionCore": [
        "@hyperion/hyperion-global/src/assert",
        "@hyperion/hyperion-core/src/FunctionInterceptor",
        "@hyperion/hyperion-core/src/ConstructorInterceptor",
        "@hyperion/hyperion-core/src/AttributeInterceptor",
        "@hyperion/hyperion-core/src/intercept",
        "@hyperion/hyperion-core/src/IRequire",
        "@hyperion/hyperion-core/src/IPromise",
        "@hyperion/hyperion-core/src/IGlobalThis",
      ],
      "hyperionDOM": [
        "@hyperion/hyperion-dom/src/IEvent",
        "@hyperion/hyperion-dom/src/IEventTarget",
        "@hyperion/hyperion-dom/src/INode",
        "@hyperion/hyperion-dom/src/IElement_",
        "@hyperion/hyperion-dom/src/IElement",
        "@hyperion/hyperion-dom/src/IHTMLElement",
        "@hyperion/hyperion-dom/src/IHTMLInputElement",
        "@hyperion/hyperion-dom/src/IWindow",
        "@hyperion/hyperion-dom/src/IXMLHttpRequest",
        "@hyperion/hyperion-dom/src/ICSSStyleDeclaration",
        "@hyperion/hyperion-dom/src/IGlobalEventHandlers",
      ],
      "hyperionTrackElementsWithAttributes": [
        "@hyperion/hyperion-util/src/trackElementsWithAttributes",
      ],
      "hyperionSyncMutationObserver": [
        "@hyperion/hyperion-util/src/SyncMutationObserver",
      ],
      "hyperionUtil": [
        "@hyperion/hyperion-util/src/ClientSessionID",
        "@hyperion/hyperion-util/src/PersistentData",
      ],
      "hyperionFlowletCore": [
        "@hyperion/hyperion-flowlet/src/Flowlet",
        "@hyperion/hyperion-flowlet/src/FlowletManager",
        "@hyperion/hyperion-flowlet/src/TriggerFlowlet",
      ],
      "hyperionFlowlet": [
        "@hyperion/hyperion-flowlet/src/FlowletWrappers",
      ],
      "hyperionReact": [
        "@hyperion/hyperion-react/src/IReact",
        "@hyperion/hyperion-react/src/IReactDOM",
        "@hyperion/hyperion-react/src/IReactComponent",
      ],
      "hyperionAutoLogging": [
        "@hyperion/hyperion-autologging/src/ALEventExtension",
        "@hyperion/hyperion-autologging/src/ALCustomEvent",
        "@hyperion/hyperion-autologging/src/ALFlowletManager",
        "@hyperion/hyperion-autologging/src/ALSurface",
        "@hyperion/hyperion-autologging/src/ALSurfaceContext",
        "@hyperion/hyperion-autologging/src/ALSurfaceUtils",
        "@hyperion/hyperion-autologging/src/ALEventIndex",
        "@hyperion/hyperion-autologging/src/ALElementInfo",
        "@hyperion/hyperion-autologging/src/ALInteractableDOMElement",
        "@hyperion/hyperion-autologging/src/AutoLogging",
        "@hyperion/hyperion-autologging/src/ALUIEventPublisher",
        "@hyperion/hyperion-autologging/src/ALSessionFlowID",
      ],
      "hyperionAutoLoggingVisualizer": [
        "@hyperion/hyperion-autologging-visualizer/src/component/ALGraph",
        "@hyperion/hyperion-autologging-visualizer/src/component/ALGraphInfo.react",
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
