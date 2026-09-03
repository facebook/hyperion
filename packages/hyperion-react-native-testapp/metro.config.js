const path = require('node:path');
const { makeMetroConfig } = require('@rnx-kit/metro-config');

const useBaselineRuntime = process.env.HYPERION_BENCHMARK_BASELINE === '1';

module.exports = makeMetroConfig({
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  watchFolders: [
    path.resolve(__dirname, '../..'),
    path.resolve(__dirname, '..'),
  ],
  resolver: {
    extraNodeModules: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
    },
    unstable_enableSymlinks: true,
    useWatchman: false,
    resolveRequest: useBaselineRuntime
      ? (context, moduleName, platform) => {
          if (moduleName === 'hyperion-react-native') {
            return {
              filePath: path.resolve(
                __dirname,
                'benchmark/HyperionBaseline.js'
              ),
              type: 'sourceFile',
            };
          }
          if (moduleName === 'hyperion-react-native/jsx-runtime') {
            return context.resolveRequest(
              context,
              'react/jsx-runtime',
              platform
            );
          }
          if (moduleName === 'hyperion-react-native/jsx-dev-runtime') {
            return context.resolveRequest(
              context,
              'react/jsx-dev-runtime',
              platform
            );
          }
          return context.resolveRequest(context, moduleName, platform);
        }
      : undefined,
  },
});
