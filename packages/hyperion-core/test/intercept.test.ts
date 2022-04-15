/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { ShadowPrototype } from "../src/ShadowPrototype";
import { AttributeInterceptor } from "../src/AttributeInterceptor";
import { FunctionInterceptor } from "../src/FunctionInterceptor";
import { getVirtualPropertyValue, intercept, isIntercepted, registerShadowPrototype, registerShadowPrototypeGetter, setVirtualPropertyValue } from "../src/intercept";

describe("test interception mechanism", () => {

  function testSetup() {
    class A {
      result: string[] = [];

      _a1: number = 10;
      get a1() { return this._a1; }
      set a1(v: number) { this._a1 = v; }

      a2: boolean;
      a3: number;

      f1(s: string) {
        const tmp = `[a:${s}]`;
        this.result.push(tmp);
        return tmp;
      }

      f2: (b: boolean) => boolean;
      f3: (n: number) => number;

      _f4: (n: number) => number;
      get f4() { return this._f4; }
      set f4(func: (n: number) => number) { this._f4 = func; }

      constructor() {
        this.f3 = n => -n;
        this.a3 = 21;
      }

    }

    class B extends A {
      _b: string = "hello";
      get b() { return this._b; }
      set b(v: string) { this._b = v; }
    }

    const IAShadow = new ShadowPrototype(A.prototype, null);
    const IA = {
      a1: new AttributeInterceptor('a1', IAShadow),
      a2: new AttributeInterceptor('a2', IAShadow),
      a3: new AttributeInterceptor('a3', IAShadow),
      a4: new AttributeInterceptor('a4', IAShadow),
      f1: new FunctionInterceptor('f1', IAShadow),
      f2: new FunctionInterceptor('f2', IAShadow),
      f3: new FunctionInterceptor('f3', IAShadow),
      f4: new FunctionInterceptor('f4', IAShadow),
    };

    const IBShadow = new ShadowPrototype(B.prototype, IAShadow);
    const IB = {
      b: new AttributeInterceptor('b', IBShadow),
    }


    return { IAShadow, IBShadow, IA, IB, A, B }
  }

  test("test registerShadowPrototype", () => {
    const { IAShadow, IBShadow, IA, IB, A, B } = testSetup();

    const o = new B();

    let testCount = 0;
    const expectObjIntercepted = <T>(obj) => {
      expect(obj).toBe(o);
      testCount++;
    };
    IAShadow.onAfterInterceptObj.add(expectObjIntercepted);
    IBShadow.onAfterInterceptObj.add(expectObjIntercepted);

    intercept(o);
    expect(testCount).toBe(0); // Not yet set up the shadow prototypes
    expect(isIntercepted(o)).toBe(false);

    registerShadowPrototype(A.prototype, IAShadow);
    registerShadowPrototype(B.prototype, IBShadow);
    intercept(o);
    expect(testCount).toBe(2); // Now interceptors must have run
    expect(isIntercepted(o)).toBe(true);
  });

  test("test custom ShadowPrototype getter", () => {
    const { IAShadow, IBShadow, IA, IB, A, B } = testSetup();

    const o = new B();

    let testCount = 0;
    const expectObjIntercepted = <T>(obj) => {
      expect(obj).toBe(o);
      testCount++;
    };
    IAShadow.onAfterInterceptObj.add(expectObjIntercepted);
    IBShadow.onAfterInterceptObj.add(expectObjIntercepted);

    // The custom getter should have priority and if it does not work only IAShadow will be picked up
    registerShadowPrototype(A.prototype, IAShadow);
    const unregister = registerShadowPrototypeGetter(obj => {
      expectObjIntercepted(obj);
      if (obj instanceof B) {
        return IBShadow
      }
    });

    intercept(o);
    expect(testCount).toBe(3);
    expect(isIntercepted(o)).toBe(true);
    unregister();
  });

  test("test intercept", () => {
    const { IAShadow, IBShadow, IA, IB, A, B } = testSetup();
    registerShadowPrototype(A.prototype, IAShadow);
    registerShadowPrototype(B.prototype, IBShadow);

    const o = new B();

    let testCount = 0;
    const expectObjIntercepted = <T>(obj) => {
      expect(obj).toBe(o);
      testCount++;
    };
    IAShadow.onAfterInterceptObj.add(expectObjIntercepted);
    IBShadow.onAfterInterceptObj.add(expectObjIntercepted);

    let result = [];
    const observer = <T>(value: T) => {
      result.push(value);
    };
    const expectResultTobe = (expected: any[]) => {
      expect(result).toStrictEqual(expected);
      result = [];
    }

    IA.a1.getter.onValueObserverAdd(observer);
    IA.a1.setter.onArgsObserverAdd(observer);

    IA.a2.getter.onValueObserverAdd(observer);
    IA.a2.setter.onArgsObserverAdd(observer);

    IA.a3.getter.onValueObserverAdd(observer);
    IA.a3.setter.onArgsObserverAdd(observer);

    IA.a4.getter.onValueObserverAdd(observer);
    IA.a4.setter.onArgsObserverAdd(observer);

    IB.b.getter.onValueObserverAdd(observer);
    IB.b.setter.onArgsObserverAdd(observer);

    [IA.f1, IA.f2, IA.f3, IA.f4].forEach(fi => {
      fi.onArgsObserverAdd(observer);
      fi.onValueObserverAdd(observer);
    });

    intercept(o);
    expect(testCount).toBe(2);

    // a sequence of read/writes
    o.a1 = o.a1 + 20;
    expectResultTobe([10, 30]);

    o.a2 = !o.a2;
    expectResultTobe([undefined, true]);

    o.a3 *= 2;
    expectResultTobe([21, 42]);

    o.b = o.b + "world";
    expectResultTobe(["hello", "helloworld"]);


    o.f2 = function (this, b) { return !b; }
    o.f2(true);
    expectResultTobe([true, false]);

    o.f3(10);
    expectResultTobe([10, -10]);

    o.f4 = n => 2 * n;
    o.f4(21);
    expectResultTobe([21, 42]);
  });

  test("test virtual attribute values", () => {
    const { IAShadow, IBShadow, IA, IB, A, B } = testSetup();
    registerShadowPrototype(B.prototype, IBShadow);

    const o = new B();

    type VA = number;
    const VANAME = "_tmp";

    const va = getVirtualPropertyValue<VA>(o, VANAME) ?? setVirtualPropertyValue<VA>(o, VANAME, 42);
    expect(va).toBe(42);
  });
});