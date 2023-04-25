/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Props, Surface } from "./Surface";

function ResultViewer(props: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML += props.text;
    }
  });

  return Surface({ surface: 'result' })(
    <div ref={ref} style={{ width: "100px" }}></div>
  );
}

export default function (/* props: Props */) {
  const [text, setText] = useState<string>();

  const clear = useCallback(() => {
    setText(void 0)
  }, []);

  const links = [
    "https://hyperionjs.com/img/hyperion.svg",
    "robots.txt?a=1",
    // "https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/facebook.svg",
    // "https://www.svgrepo.com/show/4733/samples.svg",
  ];

  const onCallbackFetch = useCallback(() => {
    setText("Loading via fetch ...");
    for (const link of links) {
      fetch(link).then(response => response.text()).then(setText);
    }
  }, []);

  const onCallbackXHR = useCallback(() => {
    setText("Loading via xhr ...");
    for (const link of links) {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", link);
      xhr.addEventListener("loadend", ev => {
        setText(xhr.responseText);
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
          <td>{text ? <ResultViewer text={text}></ResultViewer> : " Click on the load button"}</td>
        </tr>
      </tbody>
    </table>
  );
}