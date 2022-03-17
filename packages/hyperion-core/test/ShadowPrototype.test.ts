/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { ShadowPrototype } from "../src/ShadowPrototype";

describe("test modern classes", () => {

  class A {
    result: string[] = [];
    a() { return "[a]"; }
  }

  class B extends A {
    b() { return "[b]"; }
  }

  test("test ShadowPrototype", () => {
    const IA = new (class extends ShadowPrototype<A>{
      interceptObjectItself(obj: A) {
        super.interceptObjectItself(obj);
        obj.result.push(obj.a());
      }
    })(A.prototype, null);

    const IB = new (class extends ShadowPrototype<B, A>{
      interceptObjectItself(obj: B) {
        super.interceptObjectItself(obj);
        obj.result.push(obj.b());
      }
    })(B.prototype, IA);

    IA.onBeforInterceptObj.add(o => o.result.push("-a"));
    IA.onAfterInterceptObj.add(o => o.result.push("+a"));
    IB.onBeforInterceptObj.add(o => o.result.push("-b"));
    IB.onAfterInterceptObj.add(o => o.result.push("+b"));

    const b = new B();

    IB.interceptObject(b);
    expect(b.result.join("")).toBe("-a-b[a][b]+a+b");
  });
});

describe("test traditional classes", () => {

  interface A {
    result: string[];
    a(): string;
  }
  function A_(this: A) {
    this.result = [];
  }
  A_.prototype.a = function () { return "[a]"; };

  interface B extends A {
    b(): string;
  }
  function B_(this: B) {
    A_.call(this);
  }
  B_.prototype = new A_();
  B_.prototype.b = function () { return "[b]"; }


  test("test ShadowPrototype", () => {
    const IA = new (class extends ShadowPrototype<A>{
      interceptObjectItself(obj: A) {
        super.interceptObjectItself(obj);
        obj.result.push(obj.a());
      }
    })(A_.prototype, null);

    const IB = new (class extends ShadowPrototype<B, A>{
      interceptObjectItself(obj: B) {
        super.interceptObjectItself(obj);
        obj.result.push(obj.b());
      }
    })(B_.prototype, IA);

    IA.onBeforInterceptObj.add(o => o.result.push("-a"));
    IA.onAfterInterceptObj.add(o => o.result.push("+a"));
    IB.onBeforInterceptObj.add(o => o.result.push("-b"));
    IB.onAfterInterceptObj.add(o => o.result.push("+b"));

    const b = new B_();

    IB.interceptObject(b);
    expect(b.result.join("")).toBe("-a-b[a][b]+a+b");
  });
})
