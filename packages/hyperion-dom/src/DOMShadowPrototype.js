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
                NodeName2ShadoPrototype.set(nodeName, this);
            }
            if (nodeType) {
                NodeType2ShadoPrototype.set(nodeType, this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRE9NU2hhZG93UHJvdG90eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRE9NU2hhZG93UHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFFOUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sdUNBQXVDLENBQUM7QUFDM0UsT0FBTyxLQUFLLFNBQVMsTUFBTSx1Q0FBdUMsQ0FBQztBQUVuRSxNQUFNLHVCQUF1QixHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO0FBQ25FLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7QUFDbkUsU0FBUyxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxFQUFFO0lBQzdDLElBQUksSUFBSSxZQUFZLElBQUksRUFBRTtRQUN4QixPQUFPLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksdUJBQXVCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUNqRztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyxDQUFDLENBQUE7QUFFRixNQUFNLE9BQU8sa0JBQ1gsU0FBUSxlQUFzQztJQUM5QyxZQUFZLG1CQUE2QyxFQUFFLG9CQUF3RCxFQUFFLE9BSXBIO1FBQ0MsSUFBSSxlQUFlLEdBQUcsbUJBQW1CLEVBQUUsU0FBUyxDQUFDO1FBQ3JELElBQUksQ0FBQyxlQUFlLElBQUksT0FBTyxFQUFFO1lBQy9CLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQztZQUNyRCxJQUFJLEdBQUcsR0FBdUIsWUFBWSxDQUFDO1lBQzNDLElBQUksQ0FBQyxHQUFHLElBQUksUUFBUSxFQUFFO2dCQUNwQixRQUFRLFFBQVEsRUFBRTtvQkFDaEIsZ0ZBQWdGO29CQUNoRixvRkFBb0Y7b0JBQ3BGLDhFQUE4RTtvQkFDOUUsd0ZBQXdGO29CQUN4RixLQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYTt3QkFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQzt3QkFBQyxNQUFNO29CQUNqRSxnR0FBZ0c7b0JBQ2hHLDRGQUE0RjtvQkFDNUYsZ0dBQWdHO29CQUNoRyw2RkFBNkY7b0JBQzdGLDJHQUEyRztvQkFDM0csNkZBQTZGO29CQUM3RixvRkFBb0Y7b0JBQ3BGLEtBQUssTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZO3dCQUFFLEdBQUcsR0FBRyxpQkFBaUIsQ0FBQzt3QkFBQyxNQUFNO29CQUNsRSw2RUFBNkU7b0JBQzdFLHVGQUF1RjtvQkFDdkYsK0VBQStFO29CQUMvRSw2RkFBNkY7b0JBQzdGLDJFQUEyRTtvQkFDM0U7d0JBQ0UsTUFBTSxDQUFDLEtBQUssRUFBRSx1Q0FBdUMsUUFBUSxFQUFFLENBQUMsQ0FBQzt3QkFDakUsTUFBTTtpQkFDVDthQUNGO1lBQ0QsSUFBSSxDQUFDLEdBQUcsSUFBSSxRQUFRLEVBQUU7Z0JBQ3BCLEdBQUcsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUMvQztZQUNELElBQUksR0FBRyxFQUFFO2dCQUNQLGVBQWUsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQzlDO1NBQ0Y7UUFDRCxNQUFNLENBQUMsT0FBTyxlQUFlLEtBQUssUUFBUSxFQUFFLDhDQUE4QyxDQUFDLENBQUM7UUFDNUYsS0FBSyxDQUFDLGVBQWUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBRTdDLElBQUksT0FBTyxFQUFFO1lBQ1gsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDdkMsSUFBSSxRQUFRLEVBQUU7Z0JBQ1osdUJBQXVCLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUM3QztZQUNELElBQUksUUFBUSxFQUFFO2dCQUNaLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDN0M7U0FDRjtJQUNILENBQUM7Q0FFRjtBQUVELE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO0FBRXRELE1BQU0sVUFBVSxtQkFBbUIsQ0FBc0IsR0FBVyxFQUFFLElBQVU7SUFDOUUsSUFBSSxXQUFXLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFLGVBQWUsQ0FBQztJQUNqRSxJQUFJLENBQUMsV0FBVyxFQUFFO1FBQ2hCLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFRCxJQUFJLE9BQU8sRUFBRTtRQUNYOzs7OztXQUtHO1FBQ0gsTUFBTSxDQUNNLEdBQUksQ0FBQyxZQUFZLEtBQUssOEJBQThCLElBQUksV0FBVyxDQUFDLFNBQVMsQ0FBQyw4QkFBOEIsRUFDdEgsb0VBQW9FLENBQ3JFLENBQUM7S0FDSDtJQUVELE9BQU8sV0FBVyxDQUFDLGtCQUFrQixDQUFrQyxJQUFJLENBQUMsQ0FBQztBQUMvRSxDQUFDIn0=