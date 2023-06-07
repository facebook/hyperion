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

describe("Test interception of module exports", () => {
  test('Intercept normal module', () => {
    const IModule = IRequire.interceptModuleExports("IRequireTestModule", TestModule, ["foo"], []);
    const handler = IModule.foo.onBeforeCallArgsObserverAdd(jest.fn(i => console.log(i)));
    TestModule.foo(10);
    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith(10);
  });

  test('Intercept module with defaults', () => {
    const IModule = IRequire.interceptModuleExports("IRequireTestModuleDefaultExports", TestModuleDefaultExports, ["default"], []);

    const handler = IModule.default.onBeforeCallArgsObserverAdd(jest.fn(i => console.log(i)));

    TestModuleDefaultExports.default(20);
    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith(20);

    TestModuleDefault(30);
    expect(handler).toBeCalledTimes(2);
    expect(handler).toBeCalledWith(30);
  });

});
