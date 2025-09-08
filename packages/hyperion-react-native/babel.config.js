const baseConfig = require('hyperion-devtools/babel.config');

module.exports = {
  presets: [
    'module:@react-native/babel-preset',
    ...baseConfig.presets,
  ],
  ...baseConfig,
};
