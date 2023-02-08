/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as React from "react";
import FuncComponent from "./FuncComponent";
import { Surface } from "./Surface";

const ForwardRefComponent = React.forwardRef<{}, { message: string }>(
  (props, _ref) => {
    return Surface({ surface: 'forwarded' })(<FuncComponent {...props} />)
  },
);

export default ForwardRefComponent;