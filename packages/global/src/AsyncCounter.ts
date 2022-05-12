/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

export class AsyncCounter {
  private count: number = 0;
  private steps: number = 0;
  private resolve!: (count: number) => void;
  private readonly promise;

  constructor(private readonly targetCount: number) {
    this.promise = new Promise<number>(resolve => {
      this.resolve = resolve
    });
  }


  getCount(): number {
    return this.count;
  }

  getSteps(): number {
    return this.steps;
  }

  private tryResolve() {
    if (this.count === this.targetCount) {
      this.resolve(this.count);
    }
  }
  countUp(count = 1): this {
    this.count += count;
    ++this.steps;
    this.tryResolve();
    return this;
  }

  countDown(count = 1): this {
    this.count -= count;
    ++this.steps;
    this.tryResolve();
    return this;
  }

  reachTarget(): Promise<number> {
    return this.promise;
  }
}
