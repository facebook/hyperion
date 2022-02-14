import "jest";
import { ShadowPrototype } from "../src/ShadowPrototype";
import { FunctionInterceptor, NullaryFunctionInterceptor } from "../src/FunctionInterceptor";

describe("test modern classes", () => {

  class A {
    result: string[] = [];
    a(s: string) {
      const tmp = "[a]" + s;
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


  test("test .original", () => {
    IAShadow.onBeforInterceptObj.add(o => o.result.push("-a"));
    IAShadow.onAfterInterceptObj.add(o => o.result.push("+a"));
    IBShadow.onBeforInterceptObj.add(o => o.result.push("-b"));
    IBShadow.onAfterInterceptObj.add(o => o.result.push("+b"));


    const b = new B();
    IBShadow.interceptObject(b);

    IA.a.original.apply(b, ['a']);
    IB.b.original.apply(b);

    expect(b.result.join("")).toBe("-a-b+a+b[a]a[b]");
  });
});