/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { ShadowPrototype } from "../src/ShadowPrototype";
import { interceptConstructor, interceptConstructorMethod } from "../src/ConstructorInterceptor";
import { AttributeInterceptor } from "../src/AttributeInterceptor";
import * as intercept from "../src/intercept";

describe("test Constructor Interceptor", () => {

  function testSetup() {
    class A {
      _a: number = 10;
      get a() { return this._a; }
      set a(v: number) { this._a = v; }

      foo: boolean;
      baz: number;

      constructor(i = 21) {
        this.baz = i;
      }

    }

    class B extends A {
      _b: string = "hello";
      get b() { return this._b; }
      set b(v: string) { this._b = v; }
    }

    const IAShadow = new ShadowPrototype(A.prototype, null);
    const IA = {
      a: new AttributeInterceptor('a', IAShadow),
      foo: new AttributeInterceptor('foo', IAShadow),
      baz: new AttributeInterceptor('baz', IAShadow),
      bar: new AttributeInterceptor('bar', IAShadow),
    };
    // intercept.registerShadowPrototype(A.prototype, IAShadow);

    const IBShadow = new ShadowPrototype(B.prototype, IAShadow);
    const IB = {
      b: new AttributeInterceptor('b', IBShadow),
    }
    intercept.registerShadowPrototype(B.prototype, IBShadow);


    const Ctors = { A, B };
    const ICtorsShadow = new ShadowPrototype(Ctors, null);
    const IBCtor = interceptConstructorMethod<'B', typeof Ctors, { new(i: number): B }>('B', ICtorsShadow);

    type T1 = { new(i: number): B };
    type T2 = ConstructorParameters<T1>

    return { IAShadow, IBShadow, IA, IB, Ctors, IBCtor }
  }

  test("test direct constructor interceptor", () => {
    class B {
      constructor(public n: number, public s: string) {
      }
    }

    const IBCtor = interceptConstructor(B);

    let result: any[] = [];
    let observer = <T>(value: T) => { result.push(value) };
    const expectResultTobe = (id: any, expected: any[]) => {
      result.push(id);
      expected.push(id);
      expect(result).toStrictEqual(expected);
      result = [];
    }

    IBCtor.onBeforeCallArgsMapperAdd(function (this, args) {
      observer([...args]);
      args[0] += 1;
      args[1] += "-world";
      return args;
    })
    IBCtor.onBeforeCallArgsObserverAdd(function (this, n, s) {
      observer([n, s]);
    })

    IBCtor.onAfterReturnValueMapperAdd(function (this, value) {
      observer(value);
      return value;
    })

    IBCtor.onAfterReturnValueObserverAdd(function (this, value) {
      observer(value);
    })

    const o = new IBCtor.interceptor(20, "Hello");
    expectResultTobe("ctor", [[20, "Hello"], [21, "Hello-world"], o, o]);
  });

  test("test ctor interceptor", () => {
    const { IBShadow, IAShadow, IA, IB, IBCtor, Ctors } = testSetup();


    let result: any[] = [];
    let observer = <T>(value: T) => { result.push(value) };
    const expectResultTobe = (id: any, expected: any[]) => {
      result.push(id);
      expected.push(id);
      expect(result).toStrictEqual(expected);
      result = [];
    }

    // IAShadow.onAfterInterceptObj(argsObserver);
    IBCtor.onBeforeCallArgsObserverAdd(function (value) {
      observer(value);
    })
    IBCtor.onBeforeCallArgsMapperAdd(function (this, value) {
      const a0 = value[0];
      observer(a0);
      value[0] = a0 + 1;
      return value;
    })
    IBCtor.onAfterReturnValueObserverAdd(function (this, value) {
      observer(value);
    })
    IBCtor.onAfterReturnValueMapperAdd(function (this, value) {
      observer(value);
      return value;
    })

    const o = new Ctors.B(20);
    expectResultTobe("ctor", [20, 21, o, o]);

    IA.a.getter.onAfterReturnValueObserverAdd(observer);
    IA.a.setter.onBeforeCallArgsObserverAdd(observer);

    IA.foo.getter.onAfterReturnValueObserverAdd(observer);
    IA.foo.setter.onBeforeCallArgsObserverAdd(observer);

    IA.bar.getter.onAfterReturnValueObserverAdd(observer);
    IA.bar.setter.onBeforeCallArgsObserverAdd(observer);

    IA.baz.getter.onAfterReturnValueObserverAdd(observer);
    IA.baz.setter.onBeforeCallArgsObserverAdd(observer);

    IB.b.getter.onAfterReturnValueObserverAdd(observer);
    IB.b.setter.onBeforeCallArgsObserverAdd(observer);

    // a sequence of read/writes
    o.a = o.a + 20;
    expectResultTobe("a", [10, 30]);

    o.foo = !o.foo;
    expectResultTobe("foo", [undefined, true]);

    o.baz *= 2;
    expectResultTobe("baz", [21, 42]);

    o.b = o.b + "world";
    expectResultTobe("b", ["hello", "helloworld"]);
  });

});