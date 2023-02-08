/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Props } from "./Surface";

export default function FuncComponent(props: Props) {
  return (
    <ol data-comptype="func">
      <li>Some Func component</li>
      <li>{props.message}</li>
      <li>{props.children}</li>
    </ol>
  );
}