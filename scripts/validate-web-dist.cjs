/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const expectedArtifacts = [
  'hyperionAsyncCounter.js',
  'hyperionAutoLogging.js',
  'hyperionAutoLoggingPluginEventHash.js',
  'hyperionAutoLoggingVisualizer.js',
  'hyperionChannel.js',
  'hyperionCore.js',
  'hyperionDOM.js',
  'hyperionFlowlet.js',
  'hyperionFlowletCore.js',
  'hyperionGlobals.js',
  'hyperionHook.js',
  'hyperionReact.js',
  'hyperionSyncMutationObserver.js',
  'hyperionTestAndSet.js',
  'hyperionTimedTrigger.js',
  'hyperionTrackElementsWithAttributes.js',
  'hyperionUtil.js',
  'index.js',
];

const outputDirectory = path.resolve(__dirname, '..', 'dist');
const actualArtifacts = fs
  .readdirSync(outputDirectory)
  .filter((fileName) => fileName.endsWith('.js'))
  .sort();

if (actualArtifacts.join('\n') !== expectedArtifacts.join('\n')) {
  throw new Error(
    `Unexpected web distribution artifacts:\n${actualArtifacts.join('\n')}`
  );
}
