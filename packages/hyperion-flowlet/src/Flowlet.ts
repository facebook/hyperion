/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

export class Flowlet {
  private readonly _fullName: string;
  constructor(
    public readonly name: string,
    public readonly parent?: Flowlet
  ) {
    this._fullName = `${this.parent?.fullName() ?? ""}/${this.name}`;
  }

  fullName(): string {
    return this._fullName;
  }

  fork(name: string): Flowlet {
    return new Flowlet(name, this);
  }
}