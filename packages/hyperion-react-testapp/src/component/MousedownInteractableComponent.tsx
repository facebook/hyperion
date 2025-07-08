/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React, { useRef, useEffect } from "react";

export function MousedownInteractableComponent() {
  const mouseRef = useRef<HTMLDivElement | null>(null);

  const noop = (_) => {};

  useEffect(() => {
    if (mouseRef?.current) {
        mouseRef.current.addEventListener("mousedown", noop);
        return () => mouseRef.current?.removeEventListener("mousedown", noop)
    }
}, []);

  return (
    <div style={{margin: "15px"}}>
      <div ref={mouseRef}
        style={{border: '3px solid red', width: '100px', height: '100px'}}>
        Mousedown Only
    </div>
    </div>
  );
}
