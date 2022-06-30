/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { ShadowPrototype } from "../src/ShadowPrototype";
import { interceptFunction } from "../src/FunctionInterceptor";
import { interceptMethod } from "../src/MethodInterceptor";
import { registerShadowPrototype } from "../src/intercept";

describe("test modern classes", () => {

  function testSetup() {
    class A {
      result: string[] = [];
      a(s: string) {
        const tmp = `[a:${s}]`;
        this.result.push(tmp);
        return tmp;
      }

      foo: (b: boolean) => boolean;
      baz: (n: number) => number;

      _bar: (n: number) => number;
      get bar() { return this._bar; }
      set bar(func: (n: number) => number) { this._bar = func; }

      constructor() {
        this.baz = n => -n;
      }
    }

    class B extends A {
      b() {
        const tmp = "[b]";
        this.result.push(tmp);
        return tmp;
      }
    }

    const IAShadow = new ShadowPrototype(A.prototype, null);
    const IA = {
      a: interceptMethod('a', IAShadow),
      foo: interceptMethod('foo', IAShadow),
      baz: interceptMethod('baz', IAShadow),
      bar: interceptMethod('bar', IAShadow),
    };

    const IBShadow = new ShadowPrototype(B.prototype, IAShadow);
    const IB = {
      b: interceptMethod('b', IBShadow),
    }

    return { IAShadow, IBShadow, IA, IB, A, B }
  }

  test("test direct interception", () => {
    const func = (i: number, s: string) => i + s.length;
    func.x = 42;
    const fi = interceptFunction(func, false, null, "tester");
    const argObserver = fi.onArgsObserverAdd(jest.fn());
    const valueObserver = fi.onValueObserverAdd(jest.fn());
    expect(fi.getOriginal()).toStrictEqual(func);
    expect(fi.interceptor.x).toBe(func.x);
    const result = fi.interceptor(10, "12345");
    expect(result).toBe(15);
    expect(argObserver).toBeCalledTimes(1);
    expect(argObserver).toBeCalledWith(10, "12345");
    expect(valueObserver).toBeCalledWith(15);

    const fi2 = interceptFunction(func, false, null, "test2");
    const fi3 = interceptFunction(fi.interceptor, false, null, "test3");
    expect(fi2).toStrictEqual(fi);
    expect(fi3).toStrictEqual(fi);
  });

  test("test function interceptor data", () => {
    const func = (i: number, s: string) => i + s.length;
    func.x = 42;
    const fi = interceptFunction(func, false, null, "tester");
    const testPropName = 'randomProp';
    fi.setData(testPropName, true);
    expect(fi.getData(testPropName)).toBe(true);
  });

  test("Ensure props are carried over", () => {
    {
      const func = (i: number, s: string) => i + s.length;
      func.x = 42;
      func.toString = () => "SECRET";
      const fi = interceptFunction(func);

      expect(fi.getOriginal()).toStrictEqual(func);
      expect(fi.interceptor.x).toBe(func.x);
      expect(fi.interceptor.toString()).toBe(func.toString());
      expect(fi.interceptor + "").toBe("SECRET"); // check .toString
    }
    {
      const func = function () { return 1; };
      func.toString = () => "BAR";
      func.valueOf = () => 42;
      const fi = interceptFunction(func);
      expect(fi.interceptor.toString()).toBe(func.toString());
      expect(fi.interceptor + "").toBe("42"); // check .valueOf
      expect(<any>func == 42).toBe(true); // check .valueOf
      expect(<any>fi.interceptor == 42).toBe(true); // check .valueOf
    }
  });

  test("test output interception", () => {
    class A { };
    const AShadow = new ShadowPrototype(A.prototype, null);
    registerShadowPrototype(A.prototype, AShadow);

    const func = () => new A();
    const fi = interceptFunction(func, true);

    const observer = jest.fn();
    AShadow.onAfterInterceptObj.add(observer);

    const o = fi.interceptor();
    expect(o instanceof A).toBe(true);
    expect(observer.mock.calls.length).toBe(1);
    expect(observer.mock.calls[0][0]).toStrictEqual(o);
  });

  test("test .original", () => {
    const { IBShadow, IA, IB, B } = testSetup();

    const o = new B();
    IBShadow.interceptObject(o);

    IA.a.getOriginal().apply(o, ['1']);
    IB.b.getOriginal().apply(o);

    expect(o.result.join("")).toBe("[a:1][b]");
  });

  test("test .interceptor", () => {
    const { IBShadow, IA, IB, B } = testSetup();

    const o = new B();
    IBShadow.interceptObject(o);

    IA.a.interceptor.apply(o, ['1']);
    IB.b.interceptor.apply(o);

    expect(o.result.join("")).toBe("[a:1][b]");
  });

  test("test .custom", () => {
    const { IBShadow, IA, IB, B } = testSetup();

    const o = new B();
    IBShadow.interceptObject(o);

    IA.a.setCustom(function (this, s) {
      const tmp = `[CC:${s}]`;
      this.result.push(tmp);
      return tmp;
    });
    IB.b.setCustom(function (this) {
      const tmp = "[CC]";
      this.result.push(tmp);
      return tmp;
    })

    o.a('1');
    o.b();

    expect(o.result.join("")).toBe("[CC:1][CC]");
  });

  // TODO: somehow JEST is not able to import and understand const enums! For now copy this value here from FunctionInterceptor.ts
  const enum InterceptorState {
    HasArgsMapper = 1 << 3,
    HasArgsObserver = 1 << 2,
    HasValueMapper = 1 << 1,
    HasValueObserver = 1 << 0,
    Has_____________ = 0 | 0 | 0 | 0,
    Has_AF_AO__VF_VO = HasArgsMapper | HasArgsObserver | HasValueMapper | HasValueObserver,

  }

  test("test .interception hooks", () => {
    function testState(state: number) {
      // console.log(`testing state ${state}`);

      const { IBShadow, IA, IB, B } = testSetup();

      let result = "";
      let expectedResult = "";
      const arg0 = '1';
      let arg0Filtered = arg0;

      if (state & InterceptorState.HasArgsMapper) {
        IA.a.onArgsMapperAdd(function (value) {
          const a1 = value[0];
          expect(a1).toBe(arg0);

          result += a1;
          value[0] = `-${a1}`;
          return value;
        });
        expectedResult += arg0;
        arg0Filtered = `-${arg0}`;
      }

      if (state & InterceptorState.HasArgsObserver) {
        IA.a.onArgsObserverAdd(value => {
          result += value;
          expect(value).toBe(arg0Filtered);
        });
        expectedResult += arg0Filtered;
      }

      let value0 = `[a:${arg0Filtered}]`;
      let value0Filtered = value0;

      if (state & InterceptorState.HasValueMapper) {
        IA.a.onValueMapperAdd(value => {
          expect(value).toBe(value0);
          result += value;
          return `{${value}}`;
        });
        expectedResult += value0;
        value0Filtered = `{${value0}}`;
      }
      if (state & InterceptorState.HasValueObserver) {
        IA.a.onValueObserverAdd(value => {
          result += value;
          expect(value).toBe(value0Filtered);
        });
        expectedResult += value0Filtered;
      }

      const o = new B();
      IBShadow.interceptObject(o);
      o.a(arg0);
      // expect(o.result.join("")).toBe("-a-b+a+b...[a:-1]");
      expect(result).toBe(expectedResult);
    }
    for (let i = InterceptorState.Has_____________; i <= InterceptorState.Has_AF_AO__VF_VO; ++i) {
      testState(i);
    }
  });

  test("test .interception remove hooks", () => {
    const { IA, B } = testSetup();
    let hookCalled = 0;
    IA.a.onArgsMapperRemove(IA.a.onArgsMapperAdd(value => (hookCalled++, value)));
    IA.a.onArgsObserverRemove(IA.a.onArgsObserverAdd(_ => { hookCalled++ }));
    IA.a.onValueMapperRemove(IA.a.onValueMapperAdd(value => (hookCalled++, value)));
    IA.a.onValueObserverRemove(IA.a.onValueObserverAdd(_ => { hookCalled++ }));

    const o = new B();
    o.a('1');
    expect(hookCalled).toBe(0);
  });

  test("test interception hooks this-arg type", () => {
    const { IA, A, IB, B } = testSetup();
    const o = new B();
    IA.a.onArgsObserverAdd(function (this, value) {
      expect(this instanceof A).toBe(true);

      expect(typeof this.a).toBe("function");

      //@ts-expect-error this.b should give error
      expect(typeof this.b).toBe("function");
    });

    IB.b.onArgsObserverAdd(function (this) {
      expect(this instanceof A).toBe(true);
      expect(this instanceof B).toBe(true);

      // The following line checks both compile time and runtime correctness
      expect(typeof this.a).toBe("function");
      expect(typeof this.b).toBe("function");
      return false;
    });
  });

  test("test interception of object's own properties", () => {
    const { IBShadow, IA, B } = testSetup();
    const o = new B();
    IBShadow.interceptObject(o);

    let result: any[] = [];

    const argsObserver = <T>(value: T) => {
      result.push(value);
    };

    IA.foo.onArgsObserverAdd(argsObserver);
    IA.bar.onArgsObserverAdd(argsObserver)
    IA.baz.onArgsObserverAdd(argsObserver)

    o.foo = function (this, b) { return !b; }
    o.bar = n => 2 * n;

    result.push(o.foo(true));
    result.push(o.baz(10));
    result.push(o.bar(21));

    expect(result.join(",")).toBe("true,false,10,-10,21,42");

  });

  test("test repeated interception of same methods", () => {
    const { } = testSetup();

    const testFn = jest.fn<void, [number]>();
    class A {
      foo(n: number) {
        testFn(n);
      }
      bar() { }
    }

    class B extends A {
      foo(n: number) {
        super.foo(n * 10);
      }
    }

    const IAShadow = new ShadowPrototype(A.prototype, null);
    const IA_foo = interceptMethod("foo", IAShadow);
    const IA_bar = interceptMethod("bar", IAShadow);

    const IBShadow = new ShadowPrototype(B.prototype, IAShadow);
    const IB_foo = interceptMethod('foo', IBShadow);
    const IB_bar = interceptMethod("bar", IBShadow);

    expect(IA_foo === IB_foo).toBe(false); // each have their own method
    expect(IA_bar === IB_bar).toBe(true); // only one method, B inherits from A

    const a = new A();
    const b = new B();

    const A_foo_observer = jest.fn();
    IA_foo.onArgsObserverAdd(A_foo_observer);

    const B_foo_observer = jest.fn();
    IB_foo.onArgsObserverAdd(B_foo_observer);

    a.foo(1);
    expect(A_foo_observer.mock.calls.length).toBe(1);
    expect(A_foo_observer.mock.calls[0][0]).toBe(1);
    expect(B_foo_observer.mock.calls.length).toBe(0);

    b.foo(1);
    expect(A_foo_observer.mock.calls.length).toBe(2);
    expect(A_foo_observer.mock.calls[1][0]).toBe(10);
    expect(B_foo_observer.mock.calls.length).toBe(1);
  });

});
