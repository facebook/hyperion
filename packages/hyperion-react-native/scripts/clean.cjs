/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '..');
fs.rmSync(path.join(packageRoot, 'dist'), { recursive: true, force: true });

const sourceDirectory = path.join(packageRoot, 'src');
for (const entry of fs.readdirSync(sourceDirectory)) {
  if (/\.(?:d\.ts|js)(?:\.map)?$/.test(entry)) {
    fs.rmSync(path.join(sourceDirectory, entry));
  }
}
