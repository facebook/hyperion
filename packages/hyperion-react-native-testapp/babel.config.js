/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    [
      'hyperion-react-native/babel-plugin-stable-event-props',
      {
        eventProps: [
          'onPress',
          'onLongPress',
          'onChangeText',
          'onSubmitEditing',
          'onFocus',
          'onBlur',
          'onRefresh',
        ],
      },
    ],
    [
      '@babel/plugin-transform-react-jsx',
      { runtime: 'automatic', importSource: 'hyperion-react-native' },
    ],
  ],
};
