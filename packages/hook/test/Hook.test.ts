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

})
