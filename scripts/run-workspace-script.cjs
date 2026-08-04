/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const rootPackage = require(path.join(repositoryRoot, 'package.json'));
const scriptName = process.argv[2];
const forwardedArguments = process.argv.slice(3);
const workspaceEnvironment = { ...process.env };
for (const key of Object.keys(workspaceEnvironment)) {
  if (key.toLowerCase().startsWith('npm_')) delete workspaceEnvironment[key];
}

if (scriptName == null) {
  process.stderr.write('Usage: run-workspace-script.cjs <script> [...args]\n');
  process.exitCode = 2;
} else {
  const failures = [];
  for (const workspace of rootPackage.workspaces) {
    const workspacePath = path.resolve(repositoryRoot, workspace);
    const manifestPath = path.join(workspacePath, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = require(manifestPath);
    if (manifest.scripts?.[scriptName] == null) continue;

    const result = spawnSync(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      [
        'run',
        scriptName,
        ...(forwardedArguments.length === 0
          ? []
          : ['--', ...forwardedArguments]),
      ],
      {
        cwd: workspacePath,
        encoding: 'utf8',
        env: workspaceEnvironment,
        maxBuffer: 64 * 1024 * 1024,
      }
    );
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    if (result.status !== 0 || output.includes('npm ERR! Lifecycle script')) {
      const name = manifest.name ?? workspace;
      failures.push(name);
      process.stderr.write(
        `Workspace ${scriptName} failed: ${name} (${String(result.status)})\n`
      );
    }
  }

  if (failures.length > 0) {
    process.stderr.write(
      `Workspace ${scriptName} failures: ${failures.join(', ')}\n`
    );
    process.exitCode = 1;
  }
}
