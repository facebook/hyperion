/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

declare var __DEV__: boolean;

/**
 * We use TypeScripts interface merging feature to allow
 * each package define its own global flags locally
 * and use them, but have an api that read/write the
 * global flags in an opaque way
 */
interface GlobalFlags {
}