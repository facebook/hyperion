/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptMethod } from "hyperion-core/src/MethodInterceptor";
import { DOMShadowPrototype } from "./DOMShadowPrototype";
import { INodePrototype } from "./INode";

export const IDocumentPrototype = new DOMShadowPrototype(Document, INodePrototype, { nodeType: window.document.DOCUMENT_NODE });

export const createElement = interceptMethod("createElement", IDocumentPrototype, true);