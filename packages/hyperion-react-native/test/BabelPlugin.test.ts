/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { transformSync } from '@babel/core';
import { DEFAULT_INTERCEPT_PROPS } from '../src/ALConfig';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const plugin = require('../babel-plugin-stable-event-props.cjs');

function transform(source: string, eventProps?: readonly string[]): string {
  return (
    transformSync(source, {
      configFile: false,
      plugins: [[plugin, eventProps == null ? {} : { eventProps }]],
      parserOpts: { plugins: ['jsx'] },
    })?.code ?? ''
  );
}

describe('stable event prop transform', () => {
  test('keeps the build-time default aligned with the runtime default', () => {
    expect(plugin.DEFAULT_EVENT_PROPS).toEqual(DEFAULT_INTERCEPT_PROPS);
  });

  test('normalizes only statically visible conditional event props', () => {
    const output = transform(`
      <Pressable
        {...(enabled ? {onPress} : {})}
        {...(enabled && {onLongPress})}
        {...unknownProps}
      />
    `);

    expect(output).toContain('onPress={undefined}');
    expect(output).toContain('onLongPress={undefined}');
    expect(output).not.toContain('onChangeText={undefined}');
  });

  test('does not override explicit props or spreads after unknown data', () => {
    const output = transform(`
      <Pressable
        onPress={onPress}
        {...unknownProps}
        {...(enabled ? {onLongPress} : {})}
      />
    `);

    expect(output).not.toContain('onPress={undefined}');
    expect(output).not.toContain('onLongPress={undefined}');
  });

  test('supports the same custom event prop list as the runtime', () => {
    const output = transform(`<Control {...(enabled ? {onMagic} : {})} />`, [
      'onMagic',
    ]);

    expect(output).toContain('onMagic={undefined}');
    expect(output).not.toContain('onPress={undefined}');
  });

  test('runs before the automatic JSX transform', () => {
    const output =
      transformSync(`<Pressable {...(enabled && {onPress})} />`, {
        configFile: false,
        plugins: [
          [plugin, {}],
          [
            '@babel/plugin-transform-react-jsx',
            { importSource: 'hyperion-react-native', runtime: 'automatic' },
          ],
        ],
        parserOpts: { plugins: ['jsx'] },
      })?.code ?? '';

    expect(output).toContain('onPress: undefined');
    expect(output).toContain('hyperion-react-native/jsx-runtime');
  });
});
