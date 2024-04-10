/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

export default class TestAndSet {
  private value = false;
  public testAndSet(): boolean {
    const oldValue = this.value;
    this.value = true;
    return oldValue;
  }
}
