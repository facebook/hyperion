import { FunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { DOMShadowPrototype } from "./DOMShadowPrototype";
import { INodePrototype } from "./INode";

export const IDocumentPrototype = new DOMShadowPrototype(Document, INodePrototype, { nodeType: window.document.DOCUMENT_NODE });

export const createElement = new FunctionInterceptor("createElement", IDocumentPrototype);