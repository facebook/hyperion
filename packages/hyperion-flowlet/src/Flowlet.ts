/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

export class Flowlet<T extends {} = {}> {
  readonly data: T;
  private readonly _fullName: string;
  constructor(
    public readonly name: string,
    public readonly parent?: Flowlet<T>
  ) {
    this._fullName = `${this.parent?.fullName() ?? ""}/${this.name}`;
    this.data = Object.create(parent?.data ?? null);
  }

  fullName(): string {
    return this._fullName;
  }

  fork(name: string): Flowlet<T> {
    return new Flowlet<T>(name, this);
  }
}