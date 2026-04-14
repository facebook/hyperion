/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import * as IRequire from "../src/IRequire";
import * as TestModule from "./IRequireTestModule";
import TestModuleDefault from "./IRequireTestModuleDefault";
import * as TestModuleDefaultExports from "./IRequireTestModuleDefault";
import { setFlags, getFlags } from "hyperion-globals";

describe("WebpackModuleRuntime graceful handling", () => {
  const originalFlags = { ...getFlags() };

  afterEach(() => {
    setFlags(originalFlags);
  });

  test('interceptModuleExports works when webpack cache has no matching module', () => {
    const IModule = IRequire.interceptModuleExports("nonExistentModule", TestModule, ["foo"], []);
    const handler = IModule.foo.onBeforeCallObserverAdd(jest.fn());
    TestModule.foo(42);
    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith(42);
  });

  test('safeWebpackModuleExports flag enables null-safe getExports', () => {
    setFlags({ ...getFlags(), safeWebpackModuleExports: true });
    // With flag enabled and no webpack cache in test env, getModuleRuntime()
    // returns ModuleRuntimeBase (returns null). Verify interception still works.
    const IModule = IRequire.interceptModuleExports("missingModule", TestModule, ["foo"], []);
    const handler = IModule.foo.onBeforeCallObserverAdd(jest.fn());
    TestModule.foo(99);
    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith(99);
  });

  test('preferMetaModuleRuntime flag is respected', () => {
    setFlags({ ...getFlags(), preferMetaModuleRuntime: true });
    // In test env, require("__debug") will throw/return undefined, so it
    // falls through to ModuleRuntimeBase. Verify no crash and interception works.
    const IModule = IRequire.interceptModuleExports("anotherMissing", TestModule, ["foo"], []);
    const handler = IModule.foo.onBeforeCallObserverAdd(jest.fn());
    TestModule.foo(77);
    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith(77);
  });
});

describe("Test interception of module exports", () => {
  test('Intercept normal module', () => {
    const IModule = IRequire.interceptModuleExports("IRequireTestModule", TestModule, ["foo"], []);
    const handler = IModule.foo.onBeforeCallObserverAdd(jest.fn(i => console.log(i)));
    TestModule.foo(10);
    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith(10);
  });

  test('Intercept module with defaults', () => {
    const IModule = IRequire.interceptModuleExports("IRequireTestModuleDefaultExports", TestModuleDefaultExports, ["default"], []);

    const handler = IModule.default.onBeforeCallObserverAdd(jest.fn(i => console.log(i)));

    TestModuleDefaultExports.default(20);
    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith(20);

    TestModuleDefault(30);
    expect(handler).toBeCalledTimes(2);
    expect(handler).toBeCalledWith(30);
  });

});
