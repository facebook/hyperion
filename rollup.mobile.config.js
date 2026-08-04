import { defineConfig } from 'rollup';
import webConfig from './rollup.config.js';

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

const stripRelativeSideEffectImports = {
  name: 'strip-relative-side-effect-imports',
  generateBundle(_options, bundle) {
    for (const artifact of Object.values(bundle)) {
      if (typeof artifact.code === 'string') {
        artifact.code = artifact.code.replace(
          /(import ')[.]\/([^.]+)[.]js(';)/g,
          '$1$2$3'
        );
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
  input: {
    mobile: 'scripts/mobile-dist-entry.js',
    hyperionMobileReactNative: 'packages/hyperion-react-native/dist/index.js',
    hyperionMobileReactNativeJSXRuntime:
      'packages/hyperion-react-native/dist/jsx-runtime.js',
    hyperionMobileReactNativeJSXDevRuntime:
      'packages/hyperion-react-native/dist/jsx-dev-runtime.js',
    hyperionMobileReactNativeLegacyRuntimeInstaller:
      'packages/hyperion-react-native/dist/legacy-runtime-installer.js',
  },
  output: {
    ...webConfig.output,
    dir: './dist-mobile',
    intro: mobileIntro,
    manualChunks: mobileChunkName,
  },
  plugins: [stripRelativeSideEffectImports, ...webConfig.plugins],
  preserveEntrySignatures: 'strict',
});
