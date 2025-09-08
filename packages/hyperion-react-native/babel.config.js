const getBaseConfig = require('hyperion-devtools/babel.config');

module.exports = api => {
  baseConfig = getBaseConfig(api);
  return {
    ...baseConfig,
    presets: [
      ...(baseConfig.presets ?? []),
      'module:@react-native/babel-preset',
    ],
    plugins: [
      ...(baseConfig.plugins ?? []),
      '@babel/plugin-transform-export-namespace-from',
    ],
  }
};
