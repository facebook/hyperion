/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "hyperion-hook";
import * as INode from "hyperion-dom/src/INode";
import * as IElement from "hyperion-dom/src/IElement";

interface MutationAction<Action extends "added" | "removed"> {
  action: Action
  target: Node;
  nodes: Node[];
}

export type MutationEvent = MutationAction<"added"> | MutationAction<"removed">;

export const onDOMMutation = new Hook<(mutationEvent: MutationEvent) => void>();

INode.appendChild.onBeforeCallObserverAdd(function (this, value) {
  onDOMMutation.call({
    action: "added",
    target: this,
    nodes: [value],
  });
});

INode.insertBefore.onBeforeCallObserverAdd(function (this, newNode, _referenceNode) {
  onDOMMutation.call({
    action: "added",
    target: this,
    nodes: [newNode],
  });
});

INode.removeChild.onBeforeCallObserverAdd(function (this, node) {
  onDOMMutation.call({
    action: "removed",
    target: this,
    nodes: [node],
  });
});

INode.replaceChild.onBeforeCallObserverAdd(function (this, newChild, oldChild) {
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

IElement.innerHTML.setter.onBeforeCallObserverAdd(function (this, _value) {
  // Happens before actual call, so current children will be removed
  onDOMMutation.call({
    action: "removed",
    target: this,
    nodes: Array.from(this.childNodes),
  });
});
IElement.innerHTML.setter.onAfterCallObserverAdd(function (this) {
  // Happens after actual call, so current children will are the ones added
  onDOMMutation.call({
    action: "added",
    target: this,
    nodes: Array.from(this.childNodes),
  });
});

IElement.insertAdjacentElement.onBeforeCallObserverAdd(function (this, where, element) {
  const target = where === "afterbegin" || where === "beforeend" ? this : this.parentNode;
  if (target) {
    onDOMMutation.call({
      action: "added",
      target,
      nodes: [element]
    });
  }
});


function getNodes(nodes: (string | Node)[]): Node[] {
  /**
   * Many of the following methods can take a string or node as an argument.
   * We only want to pass nodes to the observer, so we filter out strings.
   * we could also try to convert them to nodes, but since that is less likely usage, we just filter to be sure
   */
  return nodes.filter<Node>(node => node instanceof Node);
}

IElement.after.onBeforeCallObserverAdd(function (this, ...nodes) {
  const target = this.parentNode;
  if (target) {
    onDOMMutation.call({
      action: "added",
      target,
      nodes: getNodes(nodes)
    });
  }
});

IElement.append.onBeforeCallObserverAdd(function (this, ...nodes) {
  onDOMMutation.call({
    action: "added",
    target: this,
    nodes: getNodes(nodes)
  });
});
IElement.before.onBeforeCallObserverAdd(function (this, ...nodes) {
  const target = this.parentNode;
  if (target) {
    onDOMMutation.call({
      action: "added",
      target,
      nodes: getNodes(nodes)
    });
  }
});
IElement.prepend.onBeforeCallObserverAdd(function (this, ...nodes) {
  onDOMMutation.call({
    action: "added",
    target: this,
    nodes: getNodes(nodes)
  });
});
IElement.remove.onBeforeCallObserverAdd(function (this) {
  const target = this.parentNode;
  if (target) {
    onDOMMutation.call({
      action: "removed",
      target,
      nodes: [this]
    });
  }
});
IElement.replaceChildren.onBeforeCallObserverAdd(function (this, ...nodes) {
  // should we also call this for removed children?
  onDOMMutation.call({
    action: "removed",
    target: this,
    nodes: getNodes(Array.from(this.childNodes))
  });
  onDOMMutation.call({
    action: "added",
    target: this,
    nodes: getNodes(nodes)
  });
});
IElement.replaceWith.onBeforeCallObserverAdd(function (this, ...nodes) {
  const target = this.parentNode;
  if (target) {
    onDOMMutation.call({
      action: "removed",
      target,
      nodes: [this]
    });
    onDOMMutation.call({
      action: "added",
      target,
      nodes: getNodes(nodes)
    });
  }
});
