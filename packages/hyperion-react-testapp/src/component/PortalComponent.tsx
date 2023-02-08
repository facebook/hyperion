/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React from "react";
import * as ReactDOM from "react-dom";


export default function (props: React.PropsWithChildren<{ message: string }>): React.ReactPortal | null {
  const container = document.getElementById("portal");

  if (container instanceof HTMLElement) {
    return ReactDOM.createPortal(
      <div>{props.message} </div>,
      container
    );
  }

  return null;
}