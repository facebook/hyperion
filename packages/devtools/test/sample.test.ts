import "jest";
import { add } from "../src/sample"

describe("test group", () => {
  test("add func", () => {
    const result = add(1, 2);
    expect(result).toBe(3);
  });
});
