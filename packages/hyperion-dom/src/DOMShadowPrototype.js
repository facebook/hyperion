import { assert } from "@hyperion/global";
import { ShadowPrototype } from "@hyperion/hyperion-core/src/ShadowPrototype";
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
                // TODO: register 'this' for nodeName
            }
            if (nodeType) {
                // TODO: register 'this' for nodeType
            }
        }
    }
}
export const sampleHTMLElement = window.document.head;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRE9NU2hhZG93UHJvdG90eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRE9NU2hhZG93UHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFFOUUsTUFBTSxPQUFPLGtCQUNYLFNBQVEsZUFBc0M7SUFDOUMsWUFBWSxtQkFBNkMsRUFBRSxvQkFBd0QsRUFBRSxPQUlwSDtRQUNDLElBQUksZUFBZSxHQUFHLG1CQUFtQixFQUFFLFNBQVMsQ0FBQztRQUNyRCxJQUFJLENBQUMsZUFBZSxJQUFJLE9BQU8sRUFBRTtZQUMvQixNQUFNLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDckQsSUFBSSxHQUFHLEdBQXVCLFlBQVksQ0FBQztZQUMzQyxJQUFJLENBQUMsR0FBRyxJQUFJLFFBQVEsRUFBRTtnQkFDcEIsUUFBUSxRQUFRLEVBQUU7b0JBQ2hCLGdGQUFnRjtvQkFDaEYsb0ZBQW9GO29CQUNwRiw4RUFBOEU7b0JBQzlFLHdGQUF3RjtvQkFDeEYsS0FBSyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWE7d0JBQUUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7d0JBQUMsTUFBTTtvQkFDakUsZ0dBQWdHO29CQUNoRyw0RkFBNEY7b0JBQzVGLGdHQUFnRztvQkFDaEcsNkZBQTZGO29CQUM3RiwyR0FBMkc7b0JBQzNHLDZGQUE2RjtvQkFDN0Ysb0ZBQW9GO29CQUNwRixLQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWTt3QkFBRSxHQUFHLEdBQUcsaUJBQWlCLENBQUM7d0JBQUMsTUFBTTtvQkFDbEUsNkVBQTZFO29CQUM3RSx1RkFBdUY7b0JBQ3ZGLCtFQUErRTtvQkFDL0UsNkZBQTZGO29CQUM3RiwyRUFBMkU7b0JBQzNFO3dCQUNFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsdUNBQXVDLFFBQVEsRUFBRSxDQUFDLENBQUM7d0JBQ2pFLE1BQU07aUJBQ1Q7YUFDRjtZQUNELElBQUksQ0FBQyxHQUFHLElBQUksUUFBUSxFQUFFO2dCQUNwQixHQUFHLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDL0M7WUFDRCxJQUFJLEdBQUcsRUFBRTtnQkFDUCxlQUFlLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUM5QztTQUNGO1FBQ0QsTUFBTSxDQUFDLE9BQU8sZUFBZSxLQUFLLFFBQVEsRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO1FBQzVGLEtBQUssQ0FBQyxlQUFlLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUU3QyxJQUFJLE9BQU8sRUFBRTtZQUNYLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFDO1lBQ3ZDLElBQUksUUFBUSxFQUFFO2dCQUNaLHFDQUFxQzthQUN0QztZQUNELElBQUksUUFBUSxFQUFFO2dCQUNaLHFDQUFxQzthQUN0QztTQUNGO0lBQ0gsQ0FBQztDQUVGO0FBRUQsTUFBTSxDQUFDLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMifQ==