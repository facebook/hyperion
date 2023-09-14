/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React, { useState } from "react";
import { Surface } from "./Surface";

// Toggles rendering a Surface component, useful for testing mount/unmount of Surface
export function ToggleSurfaceComponent() {
  const [isHidden, setHidden] = useState(true);

  return (
    <div style={{margin: "15px"}}>
      <button onClick={(_) => setHidden(!isHidden)}>Toggle Surface Mutation Component</button>
      { !isHidden ?
        (
          Surface({ surface: 'ToggleSurfaceComp' })(
            <div>
              <span style={{backgroundColor:"lightgreen"}}>A togglable Surface Component</span>
            </div>
          )
        ) : null
      }
    </div>
  );
}
