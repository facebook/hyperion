/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "@hyperion/hyperion-global";
import { ShadowPrototype } from "@hyperion/hyperion-core/src/ShadowPrototype";
import { VirtualAttribute } from "./VirtualAttribute";
import { getObjectExtension } from "@hyperion/hyperion-core/src/intercept";
import * as intercept from "@hyperion/hyperion-core/src/intercept";

const NodeType2ShadoPrototype = new Map<number, ShadowPrototype>();
const NodeName2ShadoPrototype = new Map<string, ShadowPrototype>();
intercept.registerShadowPrototypeGetter(node => {
  if (node instanceof Node) {
    return NodeName2ShadoPrototype.get(node.nodeName) ?? NodeType2ShadoPrototype.get(node.nodeType);
  }
  return null;
})

export class DOMShadowPrototype<ClassType extends Object, ParentType extends Object>
  extends ShadowPrototype<ClassType, ParentType> {
  constructor(targetPrototypeCtor: { prototype: ClassType }, parentShadowPrototype: ShadowPrototype<ParentType> | null, options?: {
    sampleObject?: ClassType;
    nodeName?: string,
    nodeType?: number,
    registerOnPrototype?: boolean,
    targetPrototype?: ClassType
  }) {
    let targetPrototype = options?.targetPrototype ?? targetPrototypeCtor?.prototype;
    if (!targetPrototype && options) {
      const { sampleObject, nodeName, nodeType } = options;
      let obj: object | undefined = sampleObject;
      if (!obj && nodeType) {
        switch (nodeType) {
          // case window.document.ATTRIBUTE_NODE: obj = document.createElement(""); break;
          // case window.document.CDATA_SECTION_NODE: obj = document.createElement(""); break;
          // case window.document.COMMENT_NODE: obj = document.createElement(""); break;
          // case window.document.DOCUMENT_FRAGMENT_NODE: obj = document.createElement(""); break;
          case window.document.DOCUMENT_NODE: obj = window.document; break;
          // case window.document.DOCUMENT_POSITION_CONTAINED_BY: obj = document.createElement(""); break;
          // case window.document.DOCUMENT_POSITION_CONTAINS: obj = document.createElement(""); break;
          // case window.document.DOCUMENT_POSITION_DISCONNECTED: obj = document.createElement(""); break;
          // case window.document.DOCUMENT_POSITION_FOLLOWING: obj = document.createElement(""); break;
          // case window.document.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: obj = document.createElement(""); break;
          // case window.document.DOCUMENT_POSITION_PRECEDING: obj = document.createElement(""); break;
          // case window.document.DOCUMENT_TYPE_NODE: obj = document.createElement(""); break;
          case window.document.ELEMENT_NODE: obj = sampleHTMLElement; break;
          // case window.document.ENTITY_NODE: obj = document.createElement(""); break;
          // case window.document.ENTITY_REFERENCE_NODE: obj = document.createElement(""); break;
          // case window.document.NOTATION_NODE: obj = document.createElement(""); break;
          // case window.document.PROCESSING_INSTRUCTION_NODE: obj = document.createElement(""); break;
          // case window.document.TEXT_NODE: obj = document.createElement(""); break;
          default:
            assert(false, `Unsupported and unexpected nodeType ${nodeType}`);
            break;
        }
      }
      if (!obj && nodeName) {
        obj = window.document.createElement(nodeName);
      }
      if (obj) {
        targetPrototype = Object.getPrototypeOf(obj);
      }
    }
    assert(targetPrototype && typeof targetPrototype === "object", `Cannot create shadow prototype for undefined`);
    super(targetPrototype, parentShadowPrototype);

    if (options) {
      const { nodeName, nodeType } = options;
      if (nodeName) {
        NodeName2ShadoPrototype.set(nodeName.toUpperCase(), this);
      }
      if (nodeType) {
        NodeType2ShadoPrototype.set(nodeType, this);
      }
    }

    if (options?.registerOnPrototype && targetPrototype) {
      /**
       * We can now only rely on the prototype itself, so we can register the shadow on the actual prototype
       * However, in some cases we may run into exception if the object is frozen or cross origin in the browser.
       */
      try {
        intercept.registerShadowPrototype(targetPrototype, this);
      } catch (e) {
        console.error(`Could not register shadow prototype on the prototype object.`)
      }
    }
  }

}

export const sampleHTMLElement: HTMLElement = window.document.head;

export function getVirtualAttribute<Name extends string>(obj: Object, name: Name): VirtualAttribute<Element, Name> | null {
  let shadowProto = getObjectExtension(obj, true)?.shadowPrototype;
  if (!shadowProto) {
    return null;
  }

  if (__DEV__) {
    /**
     * For DOM node, HTML nodes use case insensitive attributes, 
     * while other node types (e.g. svg, xml, ...) use case sensitive attribute names
     * we can check this based on the namespaceURI of the node
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/namespaceURI
     */
    assert(
      (<Element>obj).namespaceURI !== "http://www.w3.org/1999/xhtml" || shadowProto.extension.useCaseInsensitivePropertyName,
      `HTML Elements shadow prototypes should use case insensitive naming`
    );
  }

  return shadowProto.getVirtualProperty<VirtualAttribute<Element, Name>>(name);
}