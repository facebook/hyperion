import { __extends } from "tslib";
import { assert } from "@hyperion/global";
import { ShadowPrototype } from "@hyperion/hyperion-core/src/ShadowPrototype";
var DOMShadowPrototype = /** @class */ (function (_super) {
    __extends(DOMShadowPrototype, _super);
    function DOMShadowPrototype(targetPrototypeCtor, parentShadoPrototype, options) {
        var _this = this;
        var targetPrototype = targetPrototypeCtor === null || targetPrototypeCtor === void 0 ? void 0 : targetPrototypeCtor.prototype;
        if (!targetPrototype && options) {
            var sampleObject = options.sampleObject, nodeName = options.nodeName, nodeType = options.nodeType;
            var obj = sampleObject;
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
                        assert(false, "Unsupported and unexpected nodeType " + nodeType);
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
        assert(typeof targetPrototype === "object", "Cannot create shadow prototype for undefined");
        _this = _super.call(this, targetPrototype, parentShadoPrototype) || this;
        if (options) {
            var nodeName = options.nodeName, nodeType = options.nodeType;
            if (nodeName) {
                // TODO: register 'this' for nodeName
            }
            if (nodeType) {
                // TODO: register 'this' for nodeType
            }
        }
        return _this;
    }
    return DOMShadowPrototype;
}(ShadowPrototype));
export { DOMShadowPrototype };
export var sampleHTMLElement = window.document.head;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRE9NU2hhZG93UHJvdG90eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRE9NU2hhZG93UHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDMUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDZDQUE2QyxDQUFDO0FBRTlFO0lBQ1Usc0NBQXNDO0lBQzlDLDRCQUFZLG1CQUE2QyxFQUFFLG9CQUF3RCxFQUFFLE9BSXBIO1FBSkQsaUJBcURDO1FBaERDLElBQUksZUFBZSxHQUFHLG1CQUFtQixhQUFuQixtQkFBbUIsdUJBQW5CLG1CQUFtQixDQUFFLFNBQVMsQ0FBQztRQUNyRCxJQUFJLENBQUMsZUFBZSxJQUFJLE9BQU8sRUFBRTtZQUN2QixJQUFBLFlBQVksR0FBeUIsT0FBTyxhQUFoQyxFQUFFLFFBQVEsR0FBZSxPQUFPLFNBQXRCLEVBQUUsUUFBUSxHQUFLLE9BQU8sU0FBWixDQUFhO1lBQ3JELElBQUksR0FBRyxHQUF1QixZQUFZLENBQUM7WUFDM0MsSUFBSSxDQUFDLEdBQUcsSUFBSSxRQUFRLEVBQUU7Z0JBQ3BCLFFBQVEsUUFBUSxFQUFFO29CQUNoQixnRkFBZ0Y7b0JBQ2hGLG9GQUFvRjtvQkFDcEYsOEVBQThFO29CQUM5RSx3RkFBd0Y7b0JBQ3hGLEtBQUssTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhO3dCQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO3dCQUFDLE1BQU07b0JBQ2pFLGdHQUFnRztvQkFDaEcsNEZBQTRGO29CQUM1RixnR0FBZ0c7b0JBQ2hHLDZGQUE2RjtvQkFDN0YsMkdBQTJHO29CQUMzRyw2RkFBNkY7b0JBQzdGLG9GQUFvRjtvQkFDcEYsS0FBSyxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVk7d0JBQUUsR0FBRyxHQUFHLGlCQUFpQixDQUFDO3dCQUFDLE1BQU07b0JBQ2xFLDZFQUE2RTtvQkFDN0UsdUZBQXVGO29CQUN2RiwrRUFBK0U7b0JBQy9FLDZGQUE2RjtvQkFDN0YsMkVBQTJFO29CQUMzRTt3QkFDRSxNQUFNLENBQUMsS0FBSyxFQUFFLHlDQUF1QyxRQUFVLENBQUMsQ0FBQzt3QkFDakUsTUFBTTtpQkFDVDthQUNGO1lBQ0QsSUFBSSxDQUFDLEdBQUcsSUFBSSxRQUFRLEVBQUU7Z0JBQ3BCLEdBQUcsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUMvQztZQUNELElBQUksR0FBRyxFQUFFO2dCQUNQLGVBQWUsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQzlDO1NBQ0Y7UUFDRCxNQUFNLENBQUMsT0FBTyxlQUFlLEtBQUssUUFBUSxFQUFFLDhDQUE4QyxDQUFDLENBQUM7UUFDNUYsUUFBQSxrQkFBTSxlQUFlLEVBQUUsb0JBQW9CLENBQUMsU0FBQztRQUU3QyxJQUFJLE9BQU8sRUFBRTtZQUNILElBQUEsUUFBUSxHQUFlLE9BQU8sU0FBdEIsRUFBRSxRQUFRLEdBQUssT0FBTyxTQUFaLENBQWE7WUFDdkMsSUFBSSxRQUFRLEVBQUU7Z0JBQ1oscUNBQXFDO2FBQ3RDO1lBQ0QsSUFBSSxRQUFRLEVBQUU7Z0JBQ1oscUNBQXFDO2FBQ3RDO1NBQ0Y7O0lBQ0gsQ0FBQztJQUVILHlCQUFDO0FBQUQsQ0FBQyxBQXpERCxDQUNVLGVBQWUsR0F3RHhCOztBQUVELE1BQU0sQ0FBQyxJQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDIn0=