/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { useCallback, useRef, useState } from "react";
import { Props, Surface } from "./Surface";

export default function (/* props: Props */) {

  const ref = useRef<HTMLDivElement>(null);
  function loadText(text: string) {
    if (ref.current) {
      ref.current.innerHTML += text
    }
  }

  const clear = useCallback(() => {
    if (ref.current) {
      ref.current.innerHTML = "Click on load button"
    };
  }, []);

  const links = [
    "https://hyperionjs.com/img/hyperion.svg",
    "robots.txt?a=1",
    // "https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/facebook.svg",
    // "https://www.svgrepo.com/show/4733/samples.svg",
  ];

  const onCallbackFetch = useCallback(() => {
    loadText("Loading via fetch ...");
    for (const link of links) {
      fetch(link).then(response => response.text()).then(loadText);
    }
  }, []);

  const onCallbackXHR = useCallback(() => {
    loadText("Loading via xhr ...");
    for (const link of links) {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", link);
      xhr.addEventListener("loadend", ev => {
        loadText(xhr.responseText);
      });
      xhr.send();
    }
  }, []);

  return Surface({ surface: "loader" })(
    <table border={1}>
      <tbody>
        <tr>
          <td>
            <button onClick={clear}>Clear</button><br />
            <button onClick={onCallbackFetch}>Load image (fetch)</button><br />
            <button onClick={onCallbackXHR}>Load image (xhr)</button>
          </td>
          <td>
            <div ref={ref} style={{ width: "100px" }} ></div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}