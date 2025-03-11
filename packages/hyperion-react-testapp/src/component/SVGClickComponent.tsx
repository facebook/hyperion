import React from "react";

export default function SVGClickComponent() {
  return (
  <svg height="200" width="350" xmlns="http://www.w3.org/2000/svg" onClick={(e) => void 0}>
    <path id="lineAC" d="M 30 180 q 150 -250 300 0" stroke="blue" strokeWidth="2" fill="none"/>
    <text style={{fill:"red",fontSize:"25px"}}>
      <textPath href="#lineAC" startOffset="80">Click me SVG!</textPath>
    </text>
    Sorry, your browser does not support inline SVG.
  </svg>
  );
}
