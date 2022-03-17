/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { ShadowPrototype } from "../src/ShadowPrototype";
import { AttributeInterceptor } from "../src/AttributeInterceptor";

describe("test Attribute Interceptor", () => {

  function testSetup() {
    class A {
      _a: number = 10;
      get a() { return this._a; }
      set a(v: number) { this._a = v; }

      foo: boolean;
      baz: number;

      constructor() {
        this.baz = 21;
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

    const IBShadow = new ShadowPrototype(B.prototype, IAShadow);
    const IB = {
      b: new AttributeInterceptor('b', IBShadow),
    }

    return { IAShadow, IBShadow, IA, IB, A, B }
  }

  test("test getter / setter", () => {
    const { IBShadow, IA, IB, B } = testSetup();

    const o = new B();
    IBShadow.interceptObject(o);

    let result = [];

    const argsObserver = <T>(value: T) => {
      result.push(value);
    };

    IA.a.getter.onValueObserverAdd(argsObserver);
    IA.a.setter.onArgsObserverAdd(argsObserver);

    IA.foo.getter.onValueObserverAdd(argsObserver);
    IA.foo.setter.onArgsObserverAdd(argsObserver);

    IA.bar.getter.onValueObserverAdd(argsObserver);
    IA.bar.setter.onArgsObserverAdd(argsObserver);

    IA.baz.getter.onValueObserverAdd(argsObserver);
    IA.baz.setter.onArgsObserverAdd(argsObserver);

    IB.b.getter.onValueObserverAdd(argsObserver);
    IB.b.setter.onArgsObserverAdd(argsObserver);

    // a sequence of read/writes
    o.a = o.a + 20;
    o.foo = !o.foo;
    o.baz *= 2;
    o.b = o.b + "world";
    expect(result.join()).toBe("10,30,,true,21,42,hello,helloworld");
  });

});