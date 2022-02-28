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
                    case window.document.ATTRIBUTE_NODE:
                        obj = document.createElement("");
                        break;
                    case window.document.CDATA_SECTION_NODE:
                        obj = document.createElement("");
                        break;
                    case window.document.COMMENT_NODE:
                        obj = document.createElement("");
                        break;
                    case window.document.DOCUMENT_FRAGMENT_NODE:
                        obj = document.createElement("");
                        break;
                    case window.document.DOCUMENT_NODE:
                        obj = document.createElement("");
                        break;
                    case window.document.DOCUMENT_POSITION_CONTAINED_BY:
                        obj = document.createElement("");
                        break;
                    case window.document.DOCUMENT_POSITION_CONTAINS:
                        obj = document.createElement("");
                        break;
                    case window.document.DOCUMENT_POSITION_DISCONNECTED:
                        obj = document.createElement("");
                        break;
                    case window.document.DOCUMENT_POSITION_FOLLOWING:
                        obj = document.createElement("");
                        break;
                    case window.document.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:
                        obj = document.createElement("");
                        break;
                    case window.document.DOCUMENT_POSITION_PRECEDING:
                        obj = document.createElement("");
                        break;
                    case window.document.DOCUMENT_TYPE_NODE:
                        obj = document.createElement("");
                        break;
                    case window.document.ELEMENT_NODE:
                        obj = document.createElement("");
                        break;
                    case window.document.ENTITY_NODE:
                        obj = document.createElement("");
                        break;
                    case window.document.ENTITY_REFERENCE_NODE:
                        obj = document.createElement("");
                        break;
                    case window.document.NOTATION_NODE:
                        obj = document.createElement("");
                        break;
                    case window.document.PROCESSING_INSTRUCTION_NODE:
                        obj = document.createElement("");
                        break;
                    case window.document.TEXT_NODE:
                        obj = document.createElement("");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRE9NU2hhZG93UHJvdG90eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRE9NU2hhZG93UHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDMUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDZDQUE2QyxDQUFDO0FBRTlFO0lBQ1Usc0NBQXNDO0lBQzlDLDRCQUFZLG1CQUE2QyxFQUFFLG9CQUF3RCxFQUFFLE9BSXBIO1FBSkQsaUJBa0RDO1FBN0NDLElBQUksZUFBZSxHQUFHLG1CQUFtQixhQUFuQixtQkFBbUIsdUJBQW5CLG1CQUFtQixDQUFFLFNBQVMsQ0FBQztRQUNyRCxJQUFJLENBQUMsZUFBZSxJQUFJLE9BQU8sRUFBRTtZQUN2QixJQUFBLFlBQVksR0FBeUIsT0FBTyxhQUFoQyxFQUFFLFFBQVEsR0FBZSxPQUFPLFNBQXRCLEVBQUUsUUFBUSxHQUFLLE9BQU8sU0FBWixDQUFhO1lBQ3JELElBQUksR0FBRyxHQUF1QixZQUFZLENBQUM7WUFDM0MsSUFBSSxDQUFDLEdBQUcsSUFBSSxRQUFRLEVBQUU7Z0JBQ3BCLFFBQVEsUUFBUSxFQUFFO29CQUNoQixLQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsY0FBYzt3QkFBRSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFBQyxNQUFNO29CQUM3RSxLQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQWtCO3dCQUFFLEdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUFDLE1BQU07b0JBQ2pGLEtBQUssTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZO3dCQUFFLEdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUFDLE1BQU07b0JBQzNFLEtBQUssTUFBTSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0I7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