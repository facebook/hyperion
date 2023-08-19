/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";

import * as ALInteractableDOMElement from "../src/ALInteractableDOMElement";
import * as DomFragment from "./DomFragment";

function createTestDom(): DomFragment.DomFragment {
  return DomFragment.html(`
  <span id='1' aria-label="test1"></span>
  <span id='2' aria-description="test2"></span>
  <span id='3'>test3</span>
  <span id='4' aria-labelledby="3"></span>
  <span id='5' aria-describedby="3"></span>
  <span id='6' aria-label="test6" aria-labelledby="3 8"></span>
  <span id='7' aria-description="test7" aria-describedby="8"></span>
  <span id='8'>test8</span>
  <span id='9' aria-label="test9">ignored</span>
  <span id='10'><span aria-label="te"></span>s<span>t10</span></span>
  `);
}

function getText(id: string): string | null {
  const element = document.getElementById(id);
  return ALInteractableDOMElement.getElementTextEvent(element, null).elementName;
}

describe("Text various element text options", () => {
  test("element with simple text", () => {
    const dom = createTestDom();

    expect(getText(`1`)).toBe("test1");
    expect(getText(`2`)).toBe("test2");
    expect(getText(`3`)).toBe("test3");
    expect(getText(`4`)).toBe("test3");
    expect(getText(`5`)).toBe("test3");
    expect(getText(`6`)).toBe("test3test8");
    expect(getText(`7`)).toBe("test7");
    expect(getText(`8`)).toBe("test8");
    expect(getText(`9`)).toBe("test9");
    expect(getText(`10`)).toBe("test10");

    dom.cleanup();
  });

  test("element text callbacks", () => {
    const dom = createTestDom();
    interface ExtendedElementText extends ALInteractableDOMElement.ALElementText {
      isModified?: boolean;
      modifiedText?: string;
    }

    ALInteractableDOMElement.init({
      updateText(elementText: ExtendedElementText, domSource) {
        const { text } = elementText;
        if (/test[8-9]/.test(text)) {
          elementText.isModified = true;
          elementText.text = text.replace(/(\w+)([0-9]+)(\w*)/, "$1*$3");
          elementText.modifiedText = text;
          console.log(text, elementText);
        }
        elementText.text = elementText.text.replace(/\r\n|\r|\n/, '');
      },
      getText: (elementTexts: Readonly<ExtendedElementText[]>): ExtendedElementText => {
        return elementTexts.reduce((prev, current) => {
          return {
            ...prev,
            ...current,
            text: prev.text + ALInteractableDOMElement.extractCleanText(current.text),
            modifiedText: (prev.modifiedText ?? "") + (current.modifiedText ?? ""),
          }
        }, {
          text: "",
          source: 'innerText',
          modifiedText: ""
        });
      }
    });
    const text = ALInteractableDOMElement.getElementTextEvent(dom.root, null);
    expect(text.elementName).toBe("  test1  test2  test3  test3  test3  test3test*  test7  test*  test*  test10  ");
    console.log(text);

    dom.cleanup();
  });
});