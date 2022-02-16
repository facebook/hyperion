import "jest";
import { ShadowPrototype } from "../src/ShadowPrototype";
import { FunctionInterceptor, NullaryFunctionInterceptor } from "../src/FunctionInterceptor";

describe("test modern classes", () => {

  function testSetup() {
    class A {
      result: string[] = [];
      a(s: string) {
        const tmp = `[a:${s}]`;
        this.result.push(tmp);
        return tmp;
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
    };

    const IBShadow = new ShadowPrototype(B.prototype, IAShadow);
    const IB = {
      b: new NullaryFunctionInterceptor('b', IBShadow),
    }

    return { IAShadow, IBShadow, IA, IB, B }
  }

  test("test .original", () => {
    const { IBShadow, IA, IB, B } = testSetup();

    const o = new B();
    IBShadow.interceptObject(o);

    IA.a.original.apply(o, ['1']);
    IB.b.original.apply(o);

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
      console.log(`testing state ${state}`);

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
});