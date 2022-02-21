import "jest";
import { ShadowPrototype } from "../src/ShadowPrototype";
import { AttributeInterceptor } from "../src/AttributeInterceptor";

describe("test Attribute Interceptor", () => {

  function testSetup() {
    class A {
      _a: number = 10;
      get a() { return this._a; }
      set a(v: number) { this._a = v; }
    }

    class B extends A {
      _b: string = "hello";
      get b() { return this._b; }
      set b(v: string) { this._b = v; }
    }

    type a1 = A['a'];
    type a2 = B['a'];
    type a3 = B['b'];

    const IAShadow = new ShadowPrototype(A.prototype, null);
    const IA = {
      a: new AttributeInterceptor('a', IAShadow),
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

    let result = "";
    IA.a.getter.onValueObserverAdd(value => {
      result += value;
    });

    IA.a.setter.onArgsObserverAdd(value => {
      result += value;
    });

    IB.b.getter.onValueObserverAdd(value => {
      result += value;
    });

    IB.b.setter.onArgsObserverAdd(value => {
      result += value;
    });

    o.a = o.a + 20;
    o.b = o.b + "world";
    expect(result).toBe("1030hellohelloworld");
  });

});