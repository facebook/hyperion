/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

export class AsyncCounter {
  private count: number = 0;
  private resolve!: (count: number) => void;
  private readonly promise;

  constructor(private readonly targetCount: number) {
    this.promise = new Promise<number>(resolve => {
      this.resolve = resolve
    });
  }

  countUp(count = 1): this {
    this.count += count;
    if (this.count === this.targetCount) {
      this.resolve(this.count);
    }
    return this;
  }

  countDown(count = 1): this {
    this.count -= count;
    return this;
  }

  reachTarget(): Promise<number> {
    return this.promise;
  }
}
