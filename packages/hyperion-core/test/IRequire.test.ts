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
describe("WebpackModuleRuntime graceful handling", () => {
  test('interceptModuleExports works when webpack cache has no matching module', () => {
    // When ModuleRuntime falls through to ModuleRuntimeBase (no webpack cache
    // or __debug in test env), getExports returns null and the passed-in
    // moduleExports is used as-is.
    const IModule = IRequire.interceptModuleExports("nonExistentModule", TestModule, ["foo"], []);
    const handler = IModule.foo.onBeforeCallObserverAdd(jest.fn());
    TestModule.foo(42);
    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith(42);
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
