/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

 import { useState } from "react";
 import { Surface } from "./Surface";

 export function InputSurfaceComponent() {
  let [msg, setMsg] = useState("");
  let [display, setDisplay] = useState("");

   return Surface({ surface: 'InputSurfaceComp' })(
      <div>
      <form method="post" onSubmit={(e) => {e.preventDefault(); setDisplay(msg)}}>
        <span>A key input component. (Hit [Enter] for submission to get keypress event)</span>
        <br/>
        <span>Last submitted input: {display}</span>
        <br/>
        <input type="text" onChange={e => setMsg(e.target.value)}/>
        <input type="submit" value="Send"/>
      </form>
      </div>
    );
 }
