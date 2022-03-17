/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { Hook } from "@hyperion/hook";
import * as INode from "@hyperion/hyperion-dom/src/INode";
import * as IElement from "@hyperion/hyperion-dom/src/IElement";
export const onDOMMutation = new Hook();
INode.appendChild.onArgsObserverAdd(function (value) {
    onDOMMutation.call({
        action: "added",
        target: this,
        nodes: [value],
    });
});
INode.insertBefore.onArgsObserverAdd(function (newNode, _referenceNode) {
    onDOMMutation.call({
        action: "added",
        target: this,
        nodes: [newNode],
    });
});
INode.removeChild.onArgsObserverAdd(function (node) {
    onDOMMutation.call({
        action: "removed",
        target: this,
        nodes: [node],
    });
});
INode.replaceChild.onArgsObserverAdd(function (newChild, oldChild) {
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
IElement.innerHTML.setter.onArgsObserverAdd(function (_value) {
    // Happens before actual call, so current children will be removed
    onDOMMutation.call({
        action: "removed",
        target: this,
        nodes: Array.from(this.childNodes),
    });
});
IElement.innerHTML.setter.onValueObserverAdd(function () {
    // Happens after actual call, so current children will are the ones added
    onDOMMutation.call({
        action: "added",
        target: this,
        nodes: Array.from(this.childNodes),
    });
});
IElement.insertAdjacentElement.onArgsObserverAdd(function (where, element) {
    const target = where === "afterbegin" || where === "beforeend" ? this : this.parentNode;
    if (target) {
        onDOMMutation.call({
            action: "added",
            target,
            nodes: [element]
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY011dGF0aW9uT2JzZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTeW5jTXV0YXRpb25PYnNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0QyxPQUFPLEtBQUssS0FBSyxNQUFNLGtDQUFrQyxDQUFDO0FBQzFELE9BQU8sS0FBSyxRQUFRLE1BQU0scUNBQXFDLENBQUM7QUFVaEUsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHLElBQUksSUFBSSxFQUEwQyxDQUFDO0FBRWhGLEtBQUssQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsVUFBZ0IsS0FBSztJQUN2RCxhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ2pCLE1BQU0sRUFBRSxPQUFPO1FBQ2YsTUFBTSxFQUFFLElBQUk7UUFDWixLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUM7S0FDZixDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVILEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsVUFBZ0IsT0FBTyxFQUFFLGNBQWM7SUFDMUUsYUFBYSxDQUFDLElBQUksQ0FBQztRQUNqQixNQUFNLEVBQUUsT0FBTztRQUNmLE1BQU0sRUFBRSxJQUFJO1FBQ1osS0FBSyxFQUFFLENBQUMsT0FBTyxDQUFDO0tBQ2pCLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsS0FBSyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFnQixJQUFJO0lBQ3RELGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDakIsTUFBTSxFQUFFLFNBQVM7UUFDakIsTUFBTSxFQUFFLElBQUk7UUFDWixLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUM7S0FDZCxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVILEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsVUFBZ0IsUUFBUSxFQUFFLFFBQVE7SUFDckUsYUFBYSxDQUFDLElBQUksQ0FBQztRQUNqQixNQUFNLEVBQUUsU0FBUztRQUNqQixNQUFNLEVBQUUsSUFBSTtRQUNaLEtBQUssRUFBRSxDQUFDLFFBQVEsQ0FBQztLQUNsQixDQUFDLENBQUM7SUFDSCxhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ2pCLE1BQU0sRUFBRSxPQUFPO1FBQ2YsTUFBTSxFQUFFLElBQUk7UUFDWixLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUM7S0FDbEIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSCxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxVQUFnQixNQUFNO0lBQ2hFLGtFQUFrRTtJQUNsRSxhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ2pCLE1BQU0sRUFBRSxTQUFTO1FBQ2pCLE1BQU0sRUFBRSxJQUFJO1FBQ1osS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztLQUNuQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUNILFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDO0lBQzNDLHlFQUF5RTtJQUN6RSxhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ2pCLE1BQU0sRUFBRSxPQUFPO1FBQ2YsTUFBTSxFQUFFLElBQUk7UUFDWixLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO0tBQ25DLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsUUFBUSxDQUFDLHFCQUFxQixDQUFDLGlCQUFpQixDQUFDLFVBQWdCLEtBQUssRUFBRSxPQUFPO0lBQzdFLE1BQU0sTUFBTSxHQUFHLEtBQUssS0FBSyxZQUFZLElBQUksS0FBSyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO0lBQ3hGLElBQUksTUFBTSxFQUFFO1FBQ1YsYUFBYSxDQUFDLElBQUksQ0FBQztZQUNqQixNQUFNLEVBQUUsT0FBTztZQUNmLE1BQU07WUFDTixLQUFLLEVBQUUsQ0FBQyxPQUFPLENBQUM7U0FDakIsQ0FBQyxDQUFDO0tBQ0o7QUFDSCxDQUFDLENBQUMsQ0FBQyJ9