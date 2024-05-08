/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as React from "react";
import { FlowletManager } from "../FlowletManager";
import { Surface } from "./Surface";

function ResultViewer(props: { text: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML += props.text;
    }
  });

  return Surface({ surface: 'result', capability:{trackVisibilityThreshold: .5} })(
    <div ref={ref} style={{ width: "100px" }}></div>
  );
}

export default function (/* props: Props */) {
  const [text, setText] = React.useState<string>();

  const clear = React.useCallback(() => {
    setText(void 0)
  }, []);

  const links = [
    "https://hyperionjs.com/img/hyperion.svg",
    "robots.txt?a=1",
    // "https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/facebook.svg",
    // "https://www.svgrepo.com/show/4733/samples.svg",
  ];

  const onCallbackFetch = React.useCallback(() => {
    // setText("Loading via fetch ..."); // Note if call these now, the corresponding component will be mounted. We want to mount alap to test the alflowlet flow
    for (const link of links) {
      fetch(link).then(response => response.text()).then(text => {
        console.log("Fetch result: ", FlowletManager.top());
        setText(text);
      });
    }
  }, []);

  const onCallbackXHR = React.useCallback(() => {
    // setText("Loading via xhr ..."); // Note if call these now, the corresponding component will be mounted. We want to mount alap to test the alflowlet flow
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