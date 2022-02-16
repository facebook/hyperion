import "jest";
import { Hook } from "../src/Hook";

describe("test Hook", () => {
  test("empty callback", () => {
    const hook = new Hook<() => void>();
    expect(hook.call()).toBe(undefined);
  });

  test("single callback", () => {
    const hook = new Hook<(i: number) => boolean>();
    hook.add(i => i > 10);
    const test = hook.call(20);
    expect(test).toBe(true);
  });

  test("multiple callbacks", () => {
    const hook = new Hook<() => void>();

    let callCount = 0;
    let lastCallIndex = 0;

    hook.add(() => (callCount++, lastCallIndex = 1));
    hook.call();
    expect(callCount).toBe(1);
    expect(lastCallIndex).toBe(1);

    callCount = 0;
    hook.add(() => (callCount++, lastCallIndex = 2));
    hook.call();
    expect(callCount).toBe(2);
    expect(lastCallIndex).toBe(2);

    callCount = 0;
    hook.add(() => (callCount++, lastCallIndex = 3));
    hook.call();
    expect(callCount).toBe(3);
    expect(lastCallIndex).toBe(3);

  });

  test("remove callbacks", () => {
    const hook = new Hook<(i: number) => boolean>();
    const cb = hook.add(i => i > 10);
    expect(hook.hasCallback(cb)).toBe(true);
    expect(hook.hasCallback()).toBe(true);
    hook.remove(cb);
    expect(hook.hasCallback(cb)).toBe(false);
    expect(hook.hasCallback()).toBe(false);
    const test = hook.call(20);
    expect(test).toBe(undefined);

    // try removing random func
    expect(hook.remove(()=>false)).toBe(false);
  });

  test("one once callback", () => {
    const hook = new Hook<(i: number) => boolean>();
    const cb = hook.add(i => i > 10, true);
    expect(hook.hasCallback()).toBe(true);
    const test = hook.call(20);
    expect(test).toBe(true);
    expect(hook.hasCallback()).toBe(false);
  })

  test("multiple once callbacks", () => {
    const result = [];
    const hook = new Hook<(i: number) => void>();
    const cb1 = hook.add(i => result.push(i > 10), true);
    const cb2 = hook.add(i => result.push(i > 100), true);
    hook.add(i => result.push(i > 1000), false);
    expect(hook.hasCallback(cb1)).toBe(true);
    expect(hook.hasCallback(cb2)).toBe(true);
    const test = hook.call(20);
    expect(test).toBe(undefined);
    expect(result).toStrictEqual([true, false, false]);
    expect(hook.hasCallback(cb1)).toBe(false);
    expect(hook.hasCallback(cb2)).toBe(false);
    expect(hook.hasCallback()).toBe(true);
  });

  test("clear callbacks", () => {
    const hook = new Hook<() => void>();

    // single callback
    hook.add(() => void 0);
    expect(hook.hasCallback()).toBe(true);
    hook.clear();
    expect(hook.hasCallback()).toBe(false);

    // multiple callback
    hook.add(() => void 0);
    hook.add(() => void 0);
    expect(hook.hasCallback()).toBe(true);
    hook.clear();
    expect(hook.hasCallback()).toBe(false);
  });


})
