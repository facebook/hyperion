/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

export class Flowlet<T extends {} = {}> {
  readonly data: T;
  private _fullName: string | null = null;
  constructor(
    public readonly name: string,
    public readonly parent?: Flowlet<T> | null
  ) {
    this.data = Object.create(parent?.data ?? null);
  }

  getFullName(): string {
    if (!this._fullName) {
      this._fullName = `${this.parent?.getFullName() ?? ""}/${this.name}`;
    }
    return this._fullName;
  }

  fork(name: string): Flowlet<T> {
    return new Flowlet<T>(name, this);
  }
}