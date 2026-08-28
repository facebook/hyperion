import { defineConfig } from 'rollup';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import md5 from 'md5';
import mobileDistUtils from './scripts/mobile-dist-utils.cjs';

const { rewriteHasteSpecifiers } = mobileDistUtils;

function mobileChunkName(moduleId) {
  const id = moduleId.replaceAll('\\', '/');
  if (id.includes('/packages/hyperion-channel/')) {
    return 'hyperionMobileChannel';
  }
  if (id.includes('/packages/hyperion-hook/')) {
    return 'hyperionMobileChannel';
  }
  if (
    id.includes('/packages/hyperion-autologging/src/ALChannel.') ||
    id.includes('/packages/hyperion-autologging/src/ALPlugin.') ||
    id.includes('/packages/hyperion-autologging/src/ALPluginRuntime.') ||
    id.includes('/packages/hyperion-autologging/src/ALEventFactory.')
  ) {
    return 'hyperionMobileAutoLogging';
  }
  if (id.endsWith('/packages/hyperion-util/src/guid.js')) {
    return 'hyperionMobileGuid';
  }
}

const intro = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * This file is auto generated from the Hyperion project hosted on
 * https://github.com/facebookincubator/hyperion
 * Instead of changing this file, you should:
 * - git clone https://github.com/facebookincubator/hyperion
 * - npm install
 * - npm run build:mobile
 * - <copy the 'hyperion/dist-mobile/' files>
 * - e.g. 'scp ./dist-mobile/hyperionMobile*.js $USER@my-od.facebook.com:/data/sandcastle/boxes/fbsource/www/html/xplat-react/core/hyperion/'
 *
 * @generated <<SignedSource::00000000000000000000000000000000>>
 */

`;

export default defineConfig({
  input: {
    hyperionMobileReactNative: 'packages/hyperion-react-native/dist/index.js',
    hyperionMobileReactNativeJSXRuntime:
      'packages/hyperion-react-native/dist/jsx-runtime.js',
    hyperionMobileReactNativeJSXDevRuntime:
      'packages/hyperion-react-native/dist/jsx-dev-runtime.js',
    hyperionMobileReactNativeJSXObservation:
      'packages/hyperion-react-native/dist/ReactNativeElementObservation.js',
  },
  external: [/^react(?:\/|$)/, /^react-native(?:\/|$)/],
  output: {
    dir: './dist-mobile',
    entryFileNames: '[name].js',
    chunkFileNames: '[name].js',
    format: 'es',
    hoistTransitiveImports: false,
    intro,
    minifyInternalExports: false,
    generatedCode: {
      preset: 'es2015',
      preferConst: true,
      constBindings: true,
      symbols: false,
    },
    manualChunks: mobileChunkName,
  },
  plugins: [
    commonjs(),
    resolve(),
    {
      name: 'prepare-mobile-haste-artifacts',
      generateBundle(_options, bundle) {
        for (const artifact of Object.values(bundle)) {
          if (typeof artifact.code !== 'string') continue;
          const code = rewriteHasteSpecifiers(artifact.code);
          const signature = md5(code);
          artifact.code = code.replace(
            /@generated <<SignedSource::[^>]+>>/,
            `@generated <<SignedSource::${signature}>>`
          );
        }
      },
    },
  ],
  preserveEntrySignatures: 'strict',
  treeshake: 'smallest',
});
