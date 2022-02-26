import { assert } from "@hyperion/global";
import { ShadowPrototype } from "@hyperion/hyperion-core/src/ShadowPrototype";

export class DOMShadowPrototype<ClassType extends Object, ParentType extends Object>
  extends ShadowPrototype<ClassType, ParentType> {
  constructor(targetPrototypeCtor: { prototype: ClassType }, parentShadoPrototype: ShadowPrototype<ParentType> | null, options?: {
    sampleObject?: ClassType;
    nodeName?: string,
    nodeType?: number,
  }) {
    let targetPrototype = targetPrototypeCtor?.prototype;
    if (!targetPrototype && options) {
      const { sampleObject, nodeName, nodeType } = options;
      let obj: object | undefined = sampleObject;
      if (!obj && nodeType) {
        switch (nodeType) {
          case window.document.ATTRIBUTE_NODE: obj = document.createElement(""); break;
          case window.document.CDATA_SECTION_NODE: obj = document.createElement(""); break;
          case window.document.COMMENT_NODE: obj = document.createElement(""); break;
          case window.document.DOCUMENT_FRAGMENT_NODE: obj = document.createElement(""); break;
          case window.document.DOCUMENT_NODE: obj = document.createElement(""); break;
          case window.document.DOCUMENT_POSITION_CONTAINED_BY: obj = document.createElement(""); break;
          case window.document.DOCUMENT_POSITION_CONTAINS: obj = document.createElement(""); break;
          case window.document.DOCUMENT_POSITION_DISCONNECTED: obj = document.createElement(""); break;
          case window.document.DOCUMENT_POSITION_FOLLOWING: obj = document.createElement(""); break;
          case window.document.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: obj = document.createElement(""); break;
          case window.document.DOCUMENT_POSITION_PRECEDING: obj = document.createElement(""); break;
          case window.document.DOCUMENT_TYPE_NODE: obj = document.createElement(""); break;
          case window.document.ELEMENT_NODE: obj = document.createElement(""); break;
          case window.document.ENTITY_NODE: obj = document.createElement(""); break;
          case window.document.ENTITY_REFERENCE_NODE: obj = document.createElement(""); break;
          case window.document.NOTATION_NODE: obj = document.createElement(""); break;
          case window.document.PROCESSING_INSTRUCTION_NODE: obj = document.createElement(""); break;
          case window.document.TEXT_NODE: obj = document.createElement(""); break;
        }
      }
      if (!obj && nodeName) {
        obj = window.document.createElement(nodeName);
      }
      if (obj) {
        targetPrototype = Object.getPrototypeOf(obj);
      }
    }
    assert(targetPrototype instanceof Object, `Cannot create shadow prototype for undefined`);
    super(targetPrototype, parentShadoPrototype);

    if (options) {
      const { nodeName, nodeType } = options;
      if (nodeName) {
        // TODO: register 'this' for nodeName
      }
      if (nodeType) {
        // TODO: register 'this' for nodeType
      }
    }
  }

}

export const sampleHTMLElement = window.document.head;