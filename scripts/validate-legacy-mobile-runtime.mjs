/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rollup } from 'rollup';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import mobileDistUtils from './mobile-dist-utils.cjs';

const { getRuntimeSpecifiers, rewriteHasteSpecifiers } = mobileDistUtils;

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const mobileDistDirectory = path.join(repositoryRoot, 'dist-mobile');
const mobileChannelPath = path.join(
  mobileDistDirectory,
  'hyperionMobileChannel.js'
);

const legacyArtifacts = await generateLegacyRuntimeArtifacts();
const coreImports = getUniqueRuntimeSpecifiers(
  legacyArtifacts.get('hyperionMobileCore') ?? ''
);
const reactImports = getUniqueRuntimeSpecifiers(
  legacyArtifacts.get('hyperionMobileReact') ?? ''
);
const channelArtifact = fs.existsSync(mobileChannelPath)
  ? 'dist-mobile'
  : 'generated';
legacyArtifacts.set(
  'hyperionMobileChannel',
  channelArtifact === 'dist-mobile'
    ? fs.readFileSync(mobileChannelPath, 'utf8')
    : await generateMobileChannelArtifact()
);
const result = {
  channelArtifact,
  coreImports,
  reactImports,
  ...(await loadLegacyRuntimeArtifacts(legacyArtifacts)),
};
assertCompatibilityResult(result);
process.stdout.write(`${JSON.stringify(result)}\n`);

async function generateMobileChannelArtifact() {
  const bundle = await rollup({
    input: path.join(
      repositoryRoot,
      'packages/hyperion-react-native/dist/channel.js'
    ),
    plugins: [commonjs(), resolve()],
    treeshake: 'smallest',
  });
  const generated = await bundle.generate({
    exports: 'named',
    format: 'es',
    preserveModules: false,
  });
  await bundle.close();
  const output = generated.output.find((item) => item.type === 'chunk');
  if (output == null || output.type !== 'chunk') {
    throw new Error(
      'Failed to generate the mobile Channel compatibility entry.'
    );
  }
  return output.code;
}

async function generateLegacyRuntimeArtifacts() {
  const entryId = '\0hyperion-legacy-mobile-runtime-entry';
  const source = createLegacyEntrySource();
  const bundle = await rollup({
    input: entryId,
    external(id) {
      return isLegacyChannelModule(id);
    },
    plugins: [
      {
        name: 'legacy-mobile-runtime-entry',
        resolveId(id) {
          return id === entryId ? entryId : null;
        },
        load(id) {
          return id === entryId ? source : null;
        },
      },
      commonjs(),
      resolve(),
    ],
    treeshake: 'smallest',
  });
  const generated = await bundle.generate({
    chunkFileNames: '[name].js',
    entryFileNames: '[name].js',
    format: 'es',
    generatedCode: {
      preset: 'es2015',
      preferConst: true,
      constBindings: true,
      symbols: false,
    },
    manualChunks: legacyMobileChunkName,
    minifyInternalExports: false,
    paths(id) {
      return isLegacyChannelModule(id) ? 'hyperionMobileChannel' : id;
    },
  });
  await bundle.close();

  const artifacts = new Map();
  for (const output of generated.output) {
    if (output.type !== 'chunk') continue;
    if (!output.fileName.startsWith('hyperionMobile')) continue;
    artifacts.set(
      output.fileName.replace(/[.]js$/, ''),
      rewriteHasteSpecifiers(output.code)
    );
  }
  for (const requiredArtifact of [
    'hyperionMobileCore',
    'hyperionMobileReact',
    'hyperionMobileTestAndSet',
    'hyperionMobileUtil',
  ]) {
    if (!artifacts.has(requiredArtifact)) {
      throw new Error(
        `Failed to generate legacy compatibility artifact ${requiredArtifact}.`
      );
    }
  }
  return artifacts;
}

async function loadLegacyRuntimeArtifacts(artifacts) {
  const entryId = '\0load-legacy-mobile-runtime';
  const artifactPrefix = '\0legacy-artifact:';
  const bundle = await rollup({
    input: entryId,
    plugins: [
      {
        name: 'load-legacy-mobile-runtime',
        resolveId(id) {
          if (id === entryId) return entryId;
          return artifacts.has(id) ? `${artifactPrefix}${id}` : null;
        },
        load(id) {
          if (id === entryId) return createLoaderEntrySource();
          return id.startsWith(artifactPrefix)
            ? artifacts.get(id.slice(artifactPrefix.length))
            : null;
        },
      },
      commonjs(),
      resolve(),
    ],
    treeshake: false,
  });
  const generated = await bundle.generate({
    exports: 'named',
    format: 'cjs',
  });
  await bundle.close();
  const output = generated.output.find((item) => item.type === 'chunk');
  if (output == null || output.type !== 'chunk') {
    throw new Error('Legacy mobile compatibility loader produced no code.');
  }
  const module = { exports: {} };
  const unsupportedRequire = (id) => {
    throw new Error(`Unexpected legacy runtime dependency: ${id}`);
  };
  Function(
    'module',
    'exports',
    'require',
    output.code
  )(module, module.exports, unsupportedRequire);
  return module.exports.default;
}

function createLegacyEntrySource() {
  const sourcePath = (...parts) =>
    JSON.stringify(path.join(repositoryRoot, 'packages', ...parts));
  return `
export {Hook as MobileHook} from ${sourcePath(
    'hyperion-hook',
    'src',
    'index.js'
  )};
export {
  Channel as MobileChannel,
  PausableChannel as MobilePausableChannel,
  PipeableEmitter as MobilePipeableEmitter,
} from ${sourcePath('hyperion-channel', 'src', 'index.js')};
export * from ${sourcePath('hyperion-core', 'src', 'index.js')};
export * from ${sourcePath('hyperion-globals', 'src', 'index.js')};
export {AttributeInterceptor, AttributeInterceptorBase, interceptAttribute, interceptAttributeBase} from ${sourcePath(
    'hyperion-core',
    'src',
    'AttributeInterceptor.js'
  )};
export {ShadowPrototype} from ${sourcePath(
    'hyperion-core',
    'src',
    'ShadowPrototype.js'
  )};
export {interceptModuleExports, validateModuleInterceptor} from ${sourcePath(
    'hyperion-core',
    'src',
    'IRequire.js'
  )};
export {IReact, IReactComponent, IReactDOM} from ${sourcePath(
    'hyperion-react',
    'src',
    'index.js'
  )};
export {ReactModule} from ${sourcePath('hyperion-react', 'src', 'IReact.js')};
export {
  init as MobileReactInit,
  onReactClassComponentElement,
  onReactClassComponentIntercept,
  onReactDOMElement,
  onReactFunctionComponentElement,
  onReactFunctionComponentIntercept,
  onReactSpecialObjectElement,
} from ${sourcePath('hyperion-react', 'src', 'IReactComponent.js')};
export {SafeGetterSetter} from ${sourcePath(
    'hyperion-util',
    'src',
    'index.js'
  )};
export {TestAndSet} from ${sourcePath(
    'hyperion-test-and-set',
    'src',
    'index.js'
  )};
`;
}

function createLoaderEntrySource() {
  return `
import * as Core from 'hyperionMobileCore';
import * as ReactRuntime from 'hyperionMobileReact';
import {
  Channel,
  Hook,
  PausableChannel,
  PipeableEmitter,
  ResilientChannel,
} from 'hyperionMobileChannel';

const hook = new Hook();
let hookCalls = 0;
hook.add(() => hookCalls++);
hook.call();

const channel = new Channel();
let channelCalls = 0;
channel.addListener('event', () => channelCalls++);
channel.emit('event');

const destination = new Channel();
let pipedCalls = 0;
destination.addListener('event', () => pipedCalls++);
const pipeable = new PipeableEmitter();
pipeable.pipe(destination);
pipeable.emit('event');

const pausable = new PausableChannel();
let pausableCalls = 0;
pausable.addListener('event', () => pausableCalls++);
pausable.pause();
pausable.emit('event');
pausable.unpause();
pausable.emit('event');

let resilientErrors = 0;
let resilientCalls = 0;
const resilient = new ResilientChannel(() => resilientErrors++);
resilient.addListener('event', () => { throw new Error('expected'); });
resilient.addListener('event', () => resilientCalls++);
resilient.emit('event');

export default {
  channelCalls,
  channelExports: [
    Channel.name,
    Hook.name,
    PausableChannel.name,
    PipeableEmitter.name,
    ResilientChannel.name,
  ],
  coreLoaded:
    typeof Core.interceptFunction === 'function' &&
    typeof Core.interceptModuleExports === 'function',
  hookCalls,
  pausableCalls,
  pipedCalls,
  reactLoaded:
    typeof ReactRuntime.IReact?.intercept === 'function' &&
    typeof ReactRuntime.IReactComponent?.init === 'function',
  resilientCalls,
  resilientErrors,
};
`;
}

function legacyMobileChunkName(moduleId) {
  const id = moduleId.replaceAll('\\', '/');
  if (id.includes('/packages/hyperion-react/')) {
    return 'hyperionMobileReact';
  }
  if (id.includes('/packages/hyperion-test-and-set/')) {
    return 'hyperionMobileTestAndSet';
  }
  if (
    id.includes('/packages/hyperion-util/') ||
    id.includes('/packages/hyperion-timed-trigger/')
  ) {
    return 'hyperionMobileUtil';
  }
  if (
    id.includes('/packages/hyperion-core/') ||
    id.includes('/packages/hyperion-globals/')
  ) {
    return 'hyperionMobileCore';
  }
}

function isLegacyChannelModule(id) {
  return (
    id === 'hyperion-channel' ||
    id.startsWith('hyperion-channel/') ||
    id === 'hyperion-hook' ||
    id.startsWith('hyperion-hook/')
  );
}

function getUniqueRuntimeSpecifiers(code) {
  return [...new Set(getRuntimeSpecifiers(code))].sort();
}

function assertCompatibilityResult(result) {
  const expected = {
    channelCalls: 1,
    channelExports: [
      'Channel',
      'Hook',
      'PausableChannel',
      'PipeableEmitter',
      'ResilientChannel',
    ],
    coreLoaded: true,
    hookCalls: 1,
    pausableCalls: 1,
    pipedCalls: 1,
    reactLoaded: true,
    resilientCalls: 1,
    resilientErrors: 1,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (JSON.stringify(result[key]) !== JSON.stringify(value)) {
      throw new Error(
        `Legacy mobile compatibility failed for ${key}: ${JSON.stringify(
          result[key]
        )}`
      );
    }
  }
  if (!result.coreImports.includes('hyperionMobileChannel')) {
    throw new Error(
      `Legacy hyperionMobileCore did not load mobile Channel: ${JSON.stringify(
        result.coreImports
      )}`
    );
  }
  for (const dependency of [
    'hyperionMobileChannel',
    'hyperionMobileCore',
    'hyperionMobileTestAndSet',
    'hyperionMobileUtil',
  ]) {
    if (!result.reactImports.includes(dependency)) {
      throw new Error(`Legacy hyperionMobileReact did not load ${dependency}.`);
    }
  }
}
