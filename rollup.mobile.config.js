import { defineConfig } from 'rollup';
import webConfig from './rollup.config.js';
import mobileDistUtils from './scripts/mobile-dist-utils.cjs';

const {
  LEGACY_RUNTIME_INSTALLER_DEPENDENCY,
  LEGACY_RUNTIME_INSTALLER_INPUT,
  rewriteHasteSpecifiers,
} = mobileDistUtils;

function mobileChunkName(moduleId) {
  const id = moduleId.replaceAll('\\', '/');

  if (
    id.endsWith(
      '/packages/hyperion-react-native/dist/ReactNativeElementObservation.js'
    )
  ) {
    return 'hyperionMobileReactNativeJSXObservation';
  }
  if (id.includes('/packages/hyperion-channel/')) {
    return 'hyperionMobileChannel';
  }
  if (id.includes('/packages/hyperion-hook/')) {
    return 'hyperionMobileChannel';
  }
  if (id.includes('/packages/hyperion-react/')) {
    return 'hyperionMobileReact';
  }
  if (id.includes('/packages/hyperion-test-and-set/')) {
    return 'hyperionMobileTestAndSet';
  }
  if (id.endsWith('/packages/hyperion-util/src/guid.js')) {
    return 'hyperionMobileGuid';
  }
  if (id.endsWith('/packages/hyperion-util/src/SyncMutationObserver.js')) {
    return 'hyperionMobileSyncMutationObserver';
  }
  if (
    id.endsWith('/packages/hyperion-util/src/trackElementsWithAttributes.js')
  ) {
    return 'hyperionMobileTrackElementsWithAttributes';
  }
  if (
    id.includes('/packages/hyperion-util/') ||
    id.includes('/packages/hyperion-timed-trigger/')
  ) {
    return 'hyperionMobileUtil';
  }
  if (id.includes('/packages/hyperion-autologging-shared/')) {
    return 'hyperionMobileAutoLoggingShared';
  }
  if (id.includes('/packages/hyperion-dom/')) {
    return 'hyperionMobileTrackElementsWithAttributes';
  }
  if (
    id.includes('/packages/hyperion-core/') ||
    id.includes('/packages/hyperion-globals/')
  ) {
    return 'hyperionMobileCore';
  }
}

const rewriteMobileHasteSpecifiers = {
  name: 'rewrite-mobile-haste-specifiers',
  generateBundle(_options, bundle) {
    for (const artifact of Object.values(bundle)) {
      if (typeof artifact.code === 'string') {
        artifact.code = rewriteHasteSpecifiers(artifact.code);
      }
    }
  },
};

const mobileIntro = webConfig.output.intro
  .replace(' * - npm run build\n', ' * - npm run build:mobile\n')
  .replace(
    " * - <copy the 'hyperion/dist/' folder>\n",
    " * - <copy the 'hyperion/dist-mobile/' files>\n"
  )
  .replace(
    " * - e.g. 'scp -r  ./dist/hyperion* $USER@my-od.facebook.com:www/html/js/hyperion/dist/'",
    " * - e.g. 'scp ./dist-mobile/hyperionMobile*.js $USER@my-od.facebook.com:/data/sandcastle/boxes/fbsource/www/html/xplat-react/core/hyperion/'"
  );

export default defineConfig({
  ...webConfig,
  external: [...webConfig.external, LEGACY_RUNTIME_INSTALLER_DEPENDENCY],
  input: {
    mobile: 'scripts/mobile-dist-entry.js',
    hyperionMobileReactNative: 'packages/hyperion-react-native/dist/index.js',
    hyperionMobileReactNativeJSXRuntime:
      'packages/hyperion-react-native/dist/jsx-runtime.js',
    hyperionMobileReactNativeJSXDevRuntime:
      'packages/hyperion-react-native/dist/jsx-dev-runtime.js',
    hyperionMobileReactNativeLegacyRuntimeInstaller:
      LEGACY_RUNTIME_INSTALLER_INPUT,
  },
  output: {
    ...webConfig.output,
    dir: './dist-mobile',
    intro: mobileIntro,
    manualChunks: mobileChunkName,
  },
  plugins: [rewriteMobileHasteSpecifiers, ...webConfig.plugins],
  preserveEntrySignatures: 'strict',
});
