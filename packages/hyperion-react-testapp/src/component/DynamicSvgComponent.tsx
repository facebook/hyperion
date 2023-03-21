/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { useCallback, useRef, useState } from "react";
import { Props } from "./Surface";

export default function (/* props: Props */) {

  const ref = useRef<HTMLDivElement>(null);
  function loadText(text: string) {
    if (ref.current) {
      ref.current.innerHTML = text
    }
  }
  let callId = 0;

  const clear = useCallback(() => {
    loadText("Click on load button");
  }, []);

  const onCallbackFetch = useCallback(() => {
    loadText("Loading via fetch ...");
    fetch(`https://hyperionjs.com/img/hyperion.svg?id=${callId++}`).then(response => response.text()).then(loadText);
  }, []);

  const onCallbackXHR = useCallback(() => {
    loadText("Loading via xhr ...");
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://hyperionjs.com/img/hyperion.svg?id=${callId++}`);
    xhr.addEventListener("loadend", ev => {
      loadText(xhr.responseText);
    });
    xhr.send();
  }, []);

  return (
    <table border={1}><tr>
      <td>
        <button onClick={clear}>Clear</button><br />
        <button onClick={onCallbackFetch}>Load image (fetch)</button><br />
        <button onClick={onCallbackXHR}>Load image (xhr)</button>
      </td>
      <td>
        <div ref={ref} style={{ width: "100px" }} ></div>
      </td>
    </tr></table>
  );
}