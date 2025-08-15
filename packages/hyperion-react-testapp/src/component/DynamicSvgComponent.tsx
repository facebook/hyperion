/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as React from "react";
import { FlowletManager } from "../FlowletManager";
import { Surface } from "./Surface";
import { link } from "fs";

function ResultViewer(props: { text: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML += props.text;
    }
  });

  return Surface({ surface: 'result', capability: { trackVisibilityThreshold: .5 } })(
    <div ref={ref} style={{ width: "100px" }}></div>
  );
}

export default function (/* props: Props */) {
  const [text, setText] = React.useState<string>();

  const clear = React.useCallback(() => {
    setText(void 0)
  }, []);

  const links = [
    // "robots.txt?a=1",
    "observability.svg",
    "Meta_Platforms_Inc_logo.svg",
    "https://hyperionjs.com/img/hyperion.svg",
    // "https://hyperionjs.com/img/favicon.ico",
    // "https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/facebook.svg",
    // "https://www.svgrepo.com/show/4733/samples.svg",
  ];

  const onCallbackFetch = React.useCallback(() => {
    // setText("Loading via fetch ..."); // Note if call these now, the corresponding component will be mounted. We want to mount alap to test the alflowlet flow
    const iterator = links[Symbol.iterator]();
    function fetchNext() {
      const next = iterator.next();
      if (next.done) {
        return;
      } else {
        const link = next.value;
        console.log("Fetching link: ", link, FlowletManager.top());
        fetch(link).then(response => response.text()).then(text => {
          console.log("Fetch results for ", link, FlowletManager.top());
          setText(text);
          setTimeout(fetchNext, 1000); // Wait a bit before fetching the next link
          // fetchNext();
        }
        ).catch(err => {
          console.error("Fetch error: ", err);
        });
      }
    }

    // Start the fetch process
    fetchNext();
  }, [links]);

  const onCallbackXHR = React.useCallback(() => {
    // setText("Loading via xhr ..."); // Note if call these now, the corresponding component will be mounted. We want to mount alap to test the alflowlet flow
    const iterator = links[Symbol.iterator]();
    function fetchNext() {
      const next = iterator.next();
      if (next.done) {
        return;
      } else {
        const link = next.value;
        console.log("Fetching xhr link: ", link, FlowletManager.top());
        const xhr = new XMLHttpRequest();
        xhr.open("GET", link);
        xhr.addEventListener("loadend", ev => {
          console.log("XHR results for ", link, FlowletManager.top());
          setText(xhr.responseText);
          setTimeout(fetchNext, 1000); // Wait a bit before fetching the next link
        });
        xhr.addEventListener("error", ev => {
          console.error("XHR error: ", ev);
        });
        xhr.send();
      }
    }

    // Start the fetch process
    fetchNext();
  }, [links]);

  return Surface({ surface: "loader" })(
    <table border={1} width={"100%"}>
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