import "jest";
import { ShadowPrototype } from "../src/ShadowPrototype";
import { FunctionInterceptor } from "../src/FunctionInterceptor";

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
      a: new FunctionInterceptor('a', IAShadow),
      foo: new FunctionInterceptor('foo', IAShadow),
      baz: new FunctionInterceptor('baz', IAShadow),
      bar: new FunctionInterceptor('bar', IAShadow),
    };

    const IBShadow = new ShadowPrototype(B.prototype, IAShadow);
    const IB = {
      b: new FunctionInterceptor('b', IBShadow),
    }

    return { IAShadow, IBShadow, IA, IB, A, B }
  }

  
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

  // TODO: somehow JEST is not able to import and understand const enums! For now copy this value here from FunctionInterceptor.ts
  const enum InterceptorState {
    HasArgsFilter = 1 << 3,
    HasArgsObserver = 1 << 2,
    HasValueFilter = 1 << 1,
    HasValueObserver = 1 << 0,
    Has_____________ = 0 | 0 | 0 | 0,
    Has_AF_AO__VF_VO = HasArgsFilter | HasArgsObserver | HasValueFilter | HasValueObserver,

  }

  test("test .interception hooks", () => {
    function testState(state: number) {
      // console.log(`testing state ${state}`);

      const { IBShadow, IA, IB, B } = testSetup();

      let result = "";
      let expectedResult = "";
      const arg0 = '1';
      let arg0Filtered = arg0;

      if (state & InterceptorState.HasArgsFilter) {
        IA.a.onArgsFilterAdd(function (value) {
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

      if (state & InterceptorState.HasValueFilter) {
        IA.a.onValueFilterAdd(value => {
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
    IA.a.onArgsFilterRemove(IA.a.onArgsFilterAdd(value => (hookCalled++, value)));
    IA.a.onArgsObserverRemove(IA.a.onArgsObserverAdd(_ => { hookCalled++ }));
    IA.a.onValueFilterRemove(IA.a.onValueFilterAdd(value => (hookCalled++, value)));
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

    let result = [];

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
});