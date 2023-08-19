/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

export interface DomFragment {
  root: HTMLElement;
  cleanup(): void;
}

export function html(text: string): DomFragment {
  const element = document.createElement("div");
  element.innerHTML = text;
  document.body.appendChild(element); // To ensure query functions of document works
  return {
    root: element,
    cleanup() {
      document.body.removeChild(element);
    },
  };
}
