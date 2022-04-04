/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { ShadowPrototype } from "../src/ShadowPrototype";
import { ConstructorInterceptor } from "../src/ConstructorInterceptor";
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
    const IBCtor = new ConstructorInterceptor<'B', typeof Ctors, { new(i: number): B }>('B', ICtorsShadow);

    type T1 = { new(i: number): B };
    type T2 = ConstructorParameters<T1>

    return { IAShadow, IBShadow, IA, IB, Ctors, IBCtor }
  }

  test("test ctor interceptor", () => {
    const { IBShadow, IAShadow, IA, IB, IBCtor, Ctors } = testSetup();


    let result = [];
    let observer = <T>(value: T) => { result.push(value) };
    const expectResultTobe = (id: any, expected: any[]) => {
      result.push(id);
      expected.push(id);
      expect(result).toStrictEqual(expected);
      result = [];
    }

    // IAShadow.onAfterInterceptObj(argsObserver);
    IBCtor.onArgsObserverAdd(function (value) {
      observer(value);
    })
    IBCtor.onArgsFilterAdd(function (this, value) {
      const a0 = value[0];
      observer(a0);
      value[0] = a0 + 1;
      return value;
    })
    IBCtor.onValueObserverAdd(function (this, value) {
      observer(value);
    })
    IBCtor.onValueFilterAdd(function (this, value) {
      observer(value);
      return value;
    })

    const o = new Ctors.B(20);
    expectResultTobe("ctor", [20, 21, o, o]);

    IA.a.getter.onValueObserverAdd(observer);
    IA.a.setter.onArgsObserverAdd(observer);

    IA.foo.getter.onValueObserverAdd(observer);
    IA.foo.setter.onArgsObserverAdd(observer);

    IA.bar.getter.onValueObserverAdd(observer);
    IA.bar.setter.onArgsObserverAdd(observer);

    IA.baz.getter.onValueObserverAdd(observer);
    IA.baz.setter.onArgsObserverAdd(observer);

    IB.b.getter.onValueObserverAdd(observer);
    IB.b.setter.onArgsObserverAdd(observer);

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