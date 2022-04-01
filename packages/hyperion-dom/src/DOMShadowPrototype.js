/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
import { ShadowPrototype } from "@hyperion/hyperion-core/src/ShadowPrototype";
import { getObjectExtension } from "@hyperion/hyperion-core/src/intercept";
import * as intercept from "@hyperion/hyperion-core/src/intercept";
const NodeType2ShadoPrototype = new Map();
const NodeName2ShadoPrototype = new Map();
intercept.registerShadowPrototypeGetter(node => {
    if (node instanceof Node) {
        return NodeType2ShadoPrototype.get(node.nodeType) ?? NodeName2ShadoPrototype.get(node.nodeName);
    }
    return null;
});
export class DOMShadowPrototype extends ShadowPrototype {
    constructor(targetPrototypeCtor, parentShadoPrototype, options) {
        let targetPrototype = targetPrototypeCtor?.prototype;
        if (!targetPrototype && options) {
            const { sampleObject, nodeName, nodeType } = options;
            let obj = sampleObject;
            if (!obj && nodeType) {
                switch (nodeType) {
                    // case window.document.ATTRIBUTE_NODE: obj = document.createElement(""); break;
                    // case window.document.CDATA_SECTION_NODE: obj = document.createElement(""); break;
                    // case window.document.COMMENT_NODE: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_FRAGMENT_NODE: obj = document.createElement(""); break;
                    case window.document.DOCUMENT_NODE:
                        obj = window.document;
                        break;
                    // case window.document.DOCUMENT_POSITION_CONTAINED_BY: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_POSITION_CONTAINS: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_POSITION_DISCONNECTED: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_POSITION_FOLLOWING: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_POSITION_PRECEDING: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_TYPE_NODE: obj = document.createElement(""); break;
                    case window.document.ELEMENT_NODE:
                        obj = sampleHTMLElement;
                        break;
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
        assert(typeof targetPrototype === "object", `Cannot create shadow prototype for undefined`);
        super(targetPrototype, parentShadoPrototype);
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
            }
            catch (e) {
                console.error(`Could not register shadow prototype on the prototype object.`);
            }
        }
    }
}
export const sampleHTMLElement = window.document.head;
export function getVirtualAttribute(obj, name) {
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
        assert(obj.namespaceURI !== "http://www.w3.org/1999/xhtml" || shadowProto.extension.useCaseInsensitivePropertyName, `HTML Elements shadow prototypes should use case insensitive naming`);
    }
    return shadowProto.getVirtualProperty(name);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRE9NU2hhZG93UHJvdG90eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRE9NU2hhZG93UHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHO0FBRUgsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQzFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUU5RSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSx1Q0FBdUMsQ0FBQztBQUMzRSxPQUFPLEtBQUssU0FBUyxNQUFNLHVDQUF1QyxDQUFDO0FBRW5FLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7QUFDbkUsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztBQUNuRSxTQUFTLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDN0MsSUFBSSxJQUFJLFlBQVksSUFBSSxFQUFFO1FBQ3hCLE9BQU8sdUJBQXVCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ2pHO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDLENBQUMsQ0FBQTtBQUVGLE1BQU0sT0FBTyxrQkFDWCxTQUFRLGVBQXNDO0lBQzlDLFlBQVksbUJBQTZDLEVBQUUsb0JBQXdELEVBQUUsT0FLcEg7UUFDQyxJQUFJLGVBQWUsR0FBRyxtQkFBbUIsRUFBRSxTQUFTLENBQUM7UUFDckQsSUFBSSxDQUFDLGVBQWUsSUFBSSxPQUFPLEVBQUU7WUFDL0IsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFDO1lBQ3JELElBQUksR0FBRyxHQUF1QixZQUFZLENBQUM7WUFDM0MsSUFBSSxDQUFDLEdBQUcsSUFBSSxRQUFRLEVBQUU7Z0JBQ3BCLFFB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