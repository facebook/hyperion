const getBaseConfig = require('hyperion-devtools/babel.config');

module.exports = (api) => {
  const baseConfig = getBaseConfig(api);
  return {
    ...baseConfig,
    plugins: [
      ...(baseConfig.plugins ?? []),
      '@babel/plugin-transform-export-namespace-from',
    ],
  };
};
