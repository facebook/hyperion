/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Surface } from "./Surface";

type Props = {
  i: number;
}
function Inner(props: Props) {
  return Surface({ surface: `S${props.i}` })(
    <Outter i={props.i - 1}></Outter>
  );
}
export default function Outter(props: Props) {
  if (props.i > 0) {
    return <Inner i={props.i}></Inner>;
  }
}