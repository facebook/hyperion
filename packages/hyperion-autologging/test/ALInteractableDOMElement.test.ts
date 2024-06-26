/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";

import * as ALInteractableDOMElement from "../src/ALInteractableDOMElement";
import * as DomFragment from "./DomFragment";
import { UIEventConfig, trackAndEnableUIEventHandlers } from "../src/ALUIEventPublisher";

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
  <input id='11'></input><label for='11'>test11</lablel>
  `);
}
function createInteractableTestDom(): DomFragment.DomFragment {
  return DomFragment.html(`
    <div id='no-interactable'>No Interactable</div>
    <div>
      <div id='atag-parent-clickable' data-clickable="1">
        <a id='atag' href="#">Create metric</a>
        <a id='atag-nohref'>Create metric</a>
      </div>
      <button id='button'>button</button>
      <input id='input'>input</input>
      <select id='select'>select</select>
      <option id='option'>option</option>
      <details id='details'>details</details>
      <dialog id='dialog'>dialog</dialog>
      <dialog id='summary'>summary</summary>
      <div id="outer-clickable" aria-busy="false" class="test" role="button" tabindex="0" data-clickable="1" data-keydownable="1">
        <span class="1">
          <div class="2">
            <div id="inner-clickable-assign-handler" class="3">
              <div id="inner-keydownable-assign-handler" class="4">
                <em id="clicked-text" class="test">Cancel</em>
              </div>
            </div>
          </div>
        </span>
      </div>
      <button id='button-with-nested'>
        <div>
          <em id="button-click-text">Continue</em>
        </div>
      </button>
    </div>
  `);
}

function getText(id: string): string | null {
  const element = document.getElementById(id);
  return ALInteractableDOMElement.getElementTextEvent(element, null).elementName;
}

function getTextFromParent(id: string, parentEvent: UIEventConfig['eventName'] | undefined): string | null {
  const element = document.getElementById(id);
  return ALInteractableDOMElement.getElementTextEvent(element, null, parentEvent).elementName;
}

describe("Test interactable detection algorithm", () => {
  function interactable(node: HTMLElement | null, eventName: UIEventConfig['eventName'], interactableOnly: boolean = true): HTMLElement | null {
    return ALInteractableDOMElement.getInteractable(node, eventName, interactableOnly);
  }

  test("Detect interactable", () => {
    const dom = DomFragment.html(`
      <div id='1' onclick="return 1;"></div>
      <div id="2" data-clickable="1">
        <span id="3">Test</span>
      </div>
    `);

    let node = document.getElementById("1");
    expect(interactable(node, "click")).toStrictEqual(node);

    node = document.getElementById("2");
    expect(interactable(node, "click")).toStrictEqual(node);

    expect(interactable(document.getElementById("3"), "click")).toStrictEqual(node);

    dom.cleanup();
  });

  test('No interactable found returns null', () => {
    const dom = createInteractableTestDom();

    const ni = document.getElementById("no-interactable");
    expect(interactable(ni, "click", true)).toBeNull();
    expect(interactable(ni, "click", false)).toBeNull();

    dom.cleanup();
  })

  test('Button with clicked nested text', () => {
    const dom = createInteractableTestDom();

    const button = document.getElementById("button-with-nested");
    const clickedText = document.getElementById("button-click-text");
    expect(interactable(clickedText, "click")).toStrictEqual(button);

    dom.cleanup();
  });

  test('Deeply nested click on text, finds interactable up dom.', () => {
    const dom = createInteractableTestDom();

    const outerClickable = document.getElementById("outer-clickable");
    const clickedText = document.getElementById("clicked-text");
    expect(interactable(clickedText, "click")).toStrictEqual(outerClickable);

    expect(interactable(clickedText, "keydown")).toStrictEqual(outerClickable);

    dom.cleanup();
  });

  test('Deeply nested click on text stops parent walking when reaching assigned handler', () => {
    const dom = createInteractableTestDom();
    const outerClickable = document.getElementById("outer-clickable");
    const clickedText = document.getElementById("clicked-text");
    // Assert base case is still valid
    expect(interactable(clickedText, "click")).toStrictEqual(outerClickable);
    expect(interactable(clickedText, "keydown")).toStrictEqual(outerClickable);
    // Assign an onclick to an inner element, and assert we stop searching up the DOM when reaching this element
    const innerClickable = document.getElementById("inner-clickable-assign-handler");
    if (innerClickable != null) {
      innerClickable.onclick = () => { console.log("inner clickable"); };
    }
    expect(interactable(clickedText, "click")).toStrictEqual(innerClickable);
    // Assign an onkeydown to an inner element, and assert we stop searching up the DOM when reaching this element
    const innerKeydownable = document.getElementById("inner-keydownable-assign-handler");
    if (innerKeydownable != null) {
      innerKeydownable.onkeydown = () => { console.log("inner keydownable"); };
    }
    expect(interactable(clickedText, "keydown")).toStrictEqual(innerKeydownable);

    dom.cleanup();
  });

  test("atag with parent clickable, with/without href, and with/without installed onclick handler", () => {
    const dom = createInteractableTestDom();
    // atag with href, and parent data-clickable
    const atag = document.getElementById("atag");
    const atagNoHref = document.getElementById("atag-nohref");
    const atagParent = document.getElementById("atag-parent-clickable");
    // Should still return a tag element, since href is present
    expect(interactable(atag, "click")).toEqual(atag);
    // Should return parent clickable, since there's no installed handler on the element and no href
    expect(interactable(atagNoHref, "click")).toEqual(atagParent);
    if (atagNoHref != null) {
      // Assign an onclick that should get detected in our interactable algorithm now, even
      // though it's an a tag, and has no href
      atagNoHref.onclick = () => { console.log("click atag"); };
    }
    expect(interactable(atagNoHref, "click")).toEqual(atagNoHref);

    dom.cleanup();
  });

  test("Specific element tags in selector are found as interactable", () => {
    const dom = createInteractableTestDom();
    ['input', 'button', 'select', 'option', 'details', 'dialog', 'summary'].forEach((elementType) => {
      const el = document.getElementById(elementType);
      expect(interactable(el, "click")).toEqual(el);
    });
    dom.cleanup();
  });
});

describe("Test various element text options", () => {
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
    expect(getText(`11`)).toBe("test11");

    dom.cleanup();
  });

  test("text extraction from parent handler element coming from interactable element tag input", () => {
    const dom = DomFragment.html(`
    <div id="outer">
      <div id="clickable" data-clickable="1">
        <span id="text-label">Grab this text</span>
        <div>
          <input id="radio-nested-no-text" type="radio" name="contact" value="email" checked="true" />
        </div>
      </div>
    </div>`
    );
    expect(getTextFromParent('clickable', "click")).toBe("Grab this text");
    // Should walk up from input -> clickable div and then extract text
    expect(getTextFromParent('radio-nested-no-text', "click")).toBe("Grab this text");
    // Should stop at input and extract nothing,  since parentEvent name is undefined
    expect(getTextFromParent('radio-nested-no-text', undefined)).toBe("");
    dom.cleanup();
  });

  test('IDs with problematic charachers', () => {
    const badId = "ain't(good)";
    const dom = DomFragment.html(`
      <input id="${badId}"></input>
      <label for="${badId}">correct!</label>
    `);

    const sanitizedId = badId.replace(/['"\[\]\(\)]/g, m => {
      return "\\" + m;
    });
    expect(document.getElementById(badId)).toStrictEqual(document.querySelector(`*[id='${sanitizedId}']`));
    expect(getText(badId)).toBe('correct!');
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
    expect(text.elementName).toBe("  test1  test2  test3  test3  test3  test3test*  test7  test*  test*  test10  test11  test11  ");
    console.log(text);
    dom.cleanup();
  });

  test("Detect interactable", () => {
    const dom = DomFragment.html(`
      <div id='1' onclick="return 1;"></div>
      <div id="2" data-clickable="1">
        <span id="3">Test</span>
      </div>
    `);

    function interactable(node: HTMLElement | null, eventName: string): HTMLElement | null {
      return ALInteractableDOMElement.getInteractable(node, "click", true);
    }

    let node = document.getElementById("1");
    expect(interactable(node, "click")).toStrictEqual(node);

    node = document.getElementById("2");
    expect(interactable(node, "click")).toStrictEqual(node);

    expect(interactable(document.getElementById("3"), "click")).toStrictEqual(node);

    dom.cleanup();
  });

  test("Detect data-*able is set correctly", () => {
    const dom = DomFragment.html(`
      <div id="attribute"></div>
      <div id="addEventListener"></div>
    `);

    trackAndEnableUIEventHandlers('click', {
      captureHandler: () => { },
      bubbleHandler: () => { },
    });

    let node = document.getElementById("attribute");
    expect(node).not.toBeNull();
    // Enable when feature is enabled again
    // if (node) {
    //   node.onclick = () => { };
    //   expect(node.getAttribute("data-clickable")).toBe("1");
    //   node.onclick = null;
    //   expect(node.getAttribute("data-clickable")).toBe(null);
    // }

    node = document.getElementById("addEventListener");
    expect(node).not.toBeNull();
    if (node) {
      node.addEventListener("click", () => { });
      expect(node.getAttribute("data-clickable")).toBe("1");
    }

    trackAndEnableUIEventHandlers('mouseover', {
      captureHandler: () => { },
      bubbleHandler: () => { },
    });

    node = document.getElementById("addEventListener");
    expect(node).not.toBeNull();
    if (node) {
      node.addEventListener("mouseover", () => { });
      expect(node.getAttribute("data-mouseoverable")).toBe("1");
    }
  });
});
