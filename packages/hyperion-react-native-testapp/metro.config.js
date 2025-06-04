const { makeMetroConfig } = require("@rnx-kit/metro-config");
module.exports = makeMetroConfig({
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  watchFolders: [require('node:path').resolve(__dirname, '../..'), require('node:path').resolve(__dirname, '..')],
  resolver: {
    unstable_enableSymlinks: true,
  },
});
