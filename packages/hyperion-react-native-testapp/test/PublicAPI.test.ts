/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

describe('public React Native package entries', () => {
  const resolve = (
    require as typeof require & {
      resolve(entry: string): string;
    }
  ).resolve;

  it.each([
    'hyperion-react-native',
    'hyperion-react-native/jsx-runtime',
    'hyperion-react-native/jsx-dev-runtime',
    'hyperion-react-native/legacy-runtime-installer',
    'hyperion-react-native/babel-plugin-stable-event-props',
  ])('resolves %s', (entry) => {
    expect(resolve(entry)).toBeTruthy();
  });

  it('keeps runtime policy out of the public package', () => {
    const declarationPath = resolve('hyperion-react-native').replace(
      /index\.js$/,
      'index.d.ts'
    );
    const declaration = require('node:fs').readFileSync(
      declarationPath,
      'utf8'
    ) as string;
    expect(declaration).not.toContain('ALProvider');
    expect(declaration).not.toContain('addChannelSubscriber');
    expect(declaration).not.toContain('logAppEvent');
    expect(declaration).not.toContain('useLogAppEvent');
    expect(declaration).not.toContain('normalizeSampleRate');
    expect(declaration).not.toContain('sanitizeMetadata');
    expect(declaration).toContain('JSXRuntimeModule');
    expect(declaration).toContain('JSXDevRuntimeModule');
  });
});
