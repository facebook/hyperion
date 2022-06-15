/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

export class Flowlet<T extends {} = {}> {
  readonly data: T;
  readonly fullName: string;
  constructor(
    public readonly name: string,
    public readonly parent?: Flowlet<T>
  ) {
    this.fullName = `${this.parent?.fullName ?? ""}/${this.name}`;
    this.data = Object.create(parent?.data ?? null);
  }

  fork(name: string): Flowlet<T> {
    return new Flowlet<T>(name, this);
  }
}