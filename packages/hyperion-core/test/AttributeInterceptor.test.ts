/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { ShadowPrototype } from "../src/ShadowPrototype";
import { interceptAttribute } from "../src/AttributeInterceptor";

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
      a: interceptAttribute('a', IAShadow),
      foo: interceptAttribute('foo', IAShadow),
      baz: interceptAttribute('baz', IAShadow),
      bar: interceptAttribute('bar', IAShadow),
    };

    const IBShadow = new ShadowPrototype(B.prototype, IAShadow);
    const IB = {
      b: interceptAttribute('b', IBShadow),
    }

    return { IAShadow, IBShadow, IA, IB, A, B }
  }

  test("test getter / setter", () => {
    const { IBShadow, IA, IB, B } = testSetup();

    const o = new B();
    IBShadow.interceptObject(o);

    const observer = jest.fn();
    function expectGetSet(getValue, setValue) {
      expect(observer.mock.calls.length).toBe(2);
      expect(observer.mock.calls[0][0]).toBe(getValue);
      expect(observer.mock.calls[1][0]).toBe(setValue);
      observer.mockClear();
    }

    IA.a.getter.onAfterCallObserverAdd(observer);
    IA.a.setter.onBeforeCallObserverAdd(observer);

    IA.foo.getter.onAfterCallObserverAdd(observer);
    IA.foo.setter.onBeforeCallObserverAdd(observer);

    IA.bar.getter.onAfterCallObserverAdd(observer);
    IA.bar.setter.onBeforeCallObserverAdd(observer);

    IA.baz.getter.onAfterCallObserverAdd(observer);
    IA.baz.setter.onBeforeCallObserverAdd(observer);

    IB.b.getter.onAfterCallObserverAdd(observer);
    IB.b.setter.onBeforeCallObserverAdd(observer);

    // a sequence of read/writes
    o.a = o.a + 20;
    expectGetSet(10, 30);

    o.foo = !o.foo;
    expectGetSet(void 0, true);

    o.baz *= 2;
    expectGetSet(21, 42);

    o.b = o.b + "world";
    expectGetSet("hello", "helloworld");
  });

  test("test repeated interception of same attribute", () => {
    class A {
      _a: number = 10;
      get a() { return this._a; }
      set a(v: number) { this._a = v; }

      _b: string = "hello";
      get b() { return this._b; }
      set b(v: string) { this._b = v; }
    }

    class B extends A {
      get a() { return super.a * 2; }
      set a(v: number) { super.a = v * 10; }
    }

    const IAShadow = new ShadowPrototype(A.prototype, null);
    const IA = {
      a: interceptAttribute('a', IAShadow),
      b: interceptAttribute('b', IAShadow),
    };

    const IBShadow = new ShadowPrototype(B.prototype, IAShadow);
    const IB = {
      a: interceptAttribute('a', IBShadow),
      b: interceptAttribute('b', IBShadow),
    }

    expect(IA.a === IB.a).toBe(false);
    expect(IA.b === IB.b).toBe(true);

    const testPropName = 'randomProp';
    IA.b.getter.setData(testPropName, true);
    expect(IB.b.getter.getData(testPropName)).toBe(true);

    const a = new A();
    const b = new B();

    const A_a_getter_observer = jest.fn();
    IA.a.getter.onAfterCallObserverAdd(A_a_getter_observer);

    const A_a_setter_observer = jest.fn();
    IA.a.setter.onBeforeCallObserverAdd(A_a_setter_observer);

    const B_a_getter_observer = jest.fn();
    IB.a.getter.onAfterCallObserverAdd(B_a_getter_observer);

    const B_a_setter_observer = jest.fn();
    IB.a.setter.onBeforeCallObserverAdd(B_a_setter_observer);

    a.a = 1;
    expect(A_a_setter_observer.mock.calls.length).toBe(1);
    expect(A_a_setter_observer.mock.calls[0][0]).toBe(1);
    expect(A_a_getter_observer.mock.calls.length).toBe(0);

    expect(B_a_setter_observer.mock.calls.length).toBe(0);
    expect(B_a_getter_observer.mock.calls.length).toBe(0);

    A_a_setter_observer.mockClear();

    b.a = 10;
    expect(b.a).toBe(200);
    expect(A_a_setter_observer.mock.calls.length).toBe(1);
    expect(A_a_setter_observer.mock.calls[0][0]).toBe(100);
    expect(A_a_getter_observer.mock.calls.length).toBe(1);
    expect(A_a_getter_observer.mock.calls[0][0]).toBe(100);

    expect(B_a_setter_observer.mock.calls.length).toBe(1);
    expect(B_a_setter_observer.mock.calls[0][0]).toBe(10);
    expect(B_a_getter_observer.mock.calls.length).toBe(1);
    expect(B_a_getter_observer.mock.calls[0][0]).toBe(200);
  });
});