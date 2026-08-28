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
  if (id.endsWith('/packages/hyperion-react-native/dist/ALActiveRuntime.js')) {
    return 'hyperionMobileReactNativeActiveRuntime';
  }
  if (
    id.endsWith(
      '/packages/hyperion-react-native/dist/ALPluginAutoLogging.js'
    ) ||
    id.endsWith('/packages/hyperion-react-native/dist/ALRuntime.js') ||
    id.endsWith('/packages/hyperion-react-native/dist/ALSession.js') ||
    id.endsWith('/packages/hyperion-react-native/dist/ALSessionPublic.js')
  ) {
    return 'hyperionMobileReactNativeRuntimeCore';
  }
  if (id.endsWith('/packages/hyperion-react-native/dist/ALMetadata.js')) {
    return 'hyperionMobileReactNativeMetadata';
  }
  if (id.endsWith('/packages/hyperion-react-native/dist/ALSurfaceContext.js')) {
    return 'hyperionMobileReactNativeSurfaceContext';
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
    hyperionMobileReactNativeRuntime:
      'packages/hyperion-react-native/dist/runtime.js',
    hyperionMobileReactNativeSurfaces:
      'packages/hyperion-react-native/dist/ALSurface.js',
    hyperionMobileReactNativeUIEvents:
      'packages/hyperion-react-native/dist/ALUIEvents.js',
    hyperionMobileReactNativeLifecycle:
      'packages/hyperion-react-native/dist/lifecycle.js',
    hyperionMobileReactNativeAppLifecycle:
      'packages/hyperion-react-native/dist/ALAppLifecycle.js',
    hyperionMobileReactNativeHeartbeat:
      'packages/hyperion-react-native/dist/ALHeartbeat.js',
    hyperionMobileReactNativeAppStateEvents:
      'packages/hyperion-react-native/dist/ALAppStateEvents.js',
    hyperionMobileReactNativeScreens:
      'packages/hyperion-react-native/dist/ALScreen.js',
    hyperionMobileReactNativeListImpressions:
      'packages/hyperion-react-native/dist/ALListViewability.js',
    hyperionMobileReactNativeDeepLinks:
      'packages/hyperion-react-native/dist/ALDeepLink.js',
    hyperionMobileReactNativeReactErrors:
      'packages/hyperion-react-native/dist/ALReactError.js',
    hyperionMobileReactNativeTransport:
      'packages/hyperion-react-native/dist/ALTransport.js',
    hyperionMobileReactNativeJSXRuntime:
      'packages/hyperion-react-native/dist/jsx-runtime.js',
    hyperionMobileReactNativeJSXDevRuntime:
      'packages/hyperion-react-native/dist/jsx-dev-runtime.js',
    hyperionMobileReactNativeJSXObservation:
      'packages/hyperion-react-native/dist/ReactNativeElementObservation.js',
    hyperionMobileReactNativeLegacyRuntimeInstaller:
      'packages/hyperion-react-native/dist/legacy-runtime-installer.js',
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
