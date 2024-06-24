/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import React from "react";

export default function (props: {
  direction: "horizontal" | "vertical";
  className?: string;
  style?: React.CSSProperties;
  // children: [React.ReactNode, React.ReactNode]
  content1: React.ReactNode;
  content2: React.ReactNode;
  resizerThickness?: number;
}): React.ReactNode {

  const containerRef = React.useRef<HTMLDivElement>(null);
  const content1Ref = React.useRef<HTMLDivElement>(null);
  const resizerRef = React.useRef<HTMLDivElement>(null);
  const content2Ref = React.useRef<HTMLDivElement>(null);
  const isHorizontalDirection = props.direction === 'horizontal';

  React.useEffect(() => {
    const container = containerRef.current;
    const content1 = content1Ref.current;
    const resizer = resizerRef.current;
    const contend2 = content2Ref.current;

    if (!container || !resizer || !content1 || !contend2) {
      return;
    }

    // The current position of mouse
    let x = 0;
    let y = 0;
    let prevSiblingHeight = 0;
    let prevSiblingWidth = 0;

    // Handle the mousedown event
    // that's triggered when user drags the resizer
    const mouseDownHandler = function (e) {
      // Get the current mouse position
      x = e.clientX;
      y = e.clientY;

      const rect = content1.getBoundingClientRect();
      prevSiblingHeight = rect.height;
      prevSiblingWidth = rect.width;

      // Attach the listeners to document
      container.addEventListener('mousemove', mouseMoveHandler);
      container.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = function (e) {
      // How far the mouse has been moved
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      const containerRect = container.getBoundingClientRect();
      let cursor: string;

      if (isHorizontalDirection) {
        const w = ((prevSiblingWidth + dx) * 100) / containerRect.width;
        content1.style.width = w + '%';
        cursor = 'col-resize';
      } else {
        const h = ((prevSiblingHeight + dy) * 100) / containerRect.height;
        content1.style.height = h + '%';
        cursor = 'row-resize';
      }

      resizer.style.cursor = cursor;
      document.body.style.cursor = cursor;

      content1.style.userSelect = 'none';
      content1.style.pointerEvents = 'none';

      contend2.style.userSelect = 'none';
      contend2.style.pointerEvents = 'none';
    };

    const mouseUpHandler = function () {
      const cursor = isHorizontalDirection ? 'ew-resize' : 'ns-resize';
      resizer.style.cursor = cursor;
      // resizer.style.removeProperty('cursor');
      document.body.style.removeProperty('cursor');

      content1.style.removeProperty('user-select');
      content1.style.removeProperty('pointer-events');

      contend2.style.removeProperty('user-select');
      contend2.style.removeProperty('pointer-events');

      // Remove the handlers of mousemove and mouseup
      container.removeEventListener('mousemove', mouseMoveHandler);
      container.removeEventListener('mouseup', mouseUpHandler);
    };

    // Attach the handler
    resizer.addEventListener('mousedown', mouseDownHandler);
  }, [isHorizontalDirection, containerRef, content1Ref, resizerRef, content2Ref]);

  const contentStyle: React.CSSProperties = {
    display: "flex",
    // alignItems: "center",
    // justifyContent: "center",
  }

  const resizerThickness = props.resizerThickness ?? '5px';

  return <div ref={containerRef} className={props.className} style={{
    border: "1px solid #cbd5e0",
    height: "100%",
    width: "100%",
    ...props.style,
    display: 'flex',
    flexDirection: isHorizontalDirection ? "row" : "column",
  }}
  >
    <div ref={content1Ref} style={{
      ...contentStyle,
      width: "75%",
    }}>{props.content1}</div>

    <div ref={resizerRef} style={{
      backgroundColor: "#cbd5e0",
      ...isHorizontalDirection
        ? {
          cursor: "ew-resize",
          height: "100%",
          width: resizerThickness,
        }
        : {
          cursor: "ns-resize",
          height: resizerThickness,
          width: "100%",
        }
    }}
    ></div>

    <div ref={content2Ref} style={{
      ...contentStyle,
      flex: "1 1 0%"
    }}>{props.content2}</div>
  </div>
}