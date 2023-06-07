/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "@hyperion/hook";
import * as INode from "@hyperion/hyperion-dom/src/INode";
import * as IElement from "@hyperion/hyperion-dom/src/IElement";

interface MutationAction<Action extends "added" | "removed"> {
  action: Action
  target: Node;
  nodes: Node[];
}

export type MutationEvent = MutationAction<"added"> | MutationAction<"removed">;

export const onDOMMutation = new Hook<(mutationEvent: MutationEvent) => void>();

INode.appendChild.onBeforeCallArgsObserverAdd(function (this, value) {
  onDOMMutation.call({
    action: "added",
    target: this,
    nodes: [value],
  });
});

INode.insertBefore.onBeforeCallArgsObserverAdd(function (this, newNode, _referenceNode) {
  onDOMMutation.call({
    action: "added",
    target: this,
    nodes: [newNode],
  });
});

INode.removeChild.onBeforeCallArgsObserverAdd(function (this, node) {
  onDOMMutation.call({
    action: "removed",
    target: this,
    nodes: [node],
  });
});

INode.replaceChild.onBeforeCallArgsObserverAdd(function (this, newChild, oldChild) {
  onDOMMutation.call({
    action: "removed",
    target: this,
    nodes: [oldChild]
  });
  onDOMMutation.call({
    action: "added",
    target: this,
    nodes: [newChild]
  });
});

IElement.innerHTML.setter.onBeforeCallArgsObserverAdd(function (this, _value) {
  // Happens before actual call, so current children will be removed
  onDOMMutation.call({
    action: "removed",
    target: this,
    nodes: Array.from(this.childNodes),
  });
});
IElement.innerHTML.setter.onAfterReturnValueObserverAdd(function (this) {
  // Happens after actual call, so current children will are the ones added
  onDOMMutation.call({
    action: "added",
    target: this,
    nodes: Array.from(this.childNodes),
  });
});

IElement.insertAdjacentElement.onBeforeCallArgsObserverAdd(function (this, where, element) {
  const target = where === "afterbegin" || where === "beforeend" ? this : this.parentNode;
  if (target) {
    onDOMMutation.call({
      action: "added",
      target,
      nodes: [element]
    });
  }
});
