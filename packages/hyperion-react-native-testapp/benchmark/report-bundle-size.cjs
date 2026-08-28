/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const outputDirectory = path.resolve(__dirname, '..', 'dist');
const metroBaseline = size('baseline.ios.jsbundle');
const metroFixture = size('fixture.ios.jsbundle');
const hermesBaseline = optionalSize('baseline.ios.hbc');
const hermesFixture = optionalSize('fixture.ios.hbc');
const report = {
  metro: {
    baselineBytes: metroBaseline,
    fixtureBytes: metroFixture,
    incrementalBytes: metroFixture - metroBaseline,
    budgetBytes: 50_000,
  },
  hermes: {
    baselineBytes: hermesBaseline,
    fixtureBytes: hermesFixture,
    incrementalBytes:
      hermesFixture == null || hermesBaseline == null
        ? null
        : hermesFixture - hermesBaseline,
    budgetBytes: 85_000,
  },
};

fs.writeFileSync(
  path.join(outputDirectory, 'autologging-bundle-report.json'),
  `${JSON.stringify(report, null, 2)}\n`
);
console.log(JSON.stringify(report, null, 2));

if (
  report.metro.incrementalBytes > report.metro.budgetBytes ||
  (report.hermes.incrementalBytes != null &&
    report.hermes.incrementalBytes > report.hermes.budgetBytes)
) {
  process.exitCode = 1;
}

function size(fileName) {
  return fs.statSync(path.join(outputDirectory, fileName)).size;
}

function optionalSize(fileName) {
  const filePath = path.join(outputDirectory, fileName);
  return fs.existsSync(filePath) ? fs.statSync(filePath).size : null;
}
