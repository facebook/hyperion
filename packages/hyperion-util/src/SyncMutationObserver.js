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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY011dGF0aW9uT2JzZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTeW5jTXV0YXRpb25PYnNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDdEMsT0FBTyxLQUFLLEtBQUssTUFBTSxrQ0FBa0MsQ0FBQztBQUMxRCxPQUFPLEtBQUssUUFBUSxNQUFNLHFDQUFxQyxDQUFDO0FBVWhFLE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxJQUFJLElBQUksRUFBMEMsQ0FBQztBQUVoRixLQUFLLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLFVBQWdCLEtBQUs7SUFDdkQsYUFBYSxDQUFDLElBQUksQ0FBQztRQUNqQixNQUFNLEVBQUUsT0FBTztRQUNmLE1BQU0sRUFBRSxJQUFJO1FBQ1osS0FBSyxFQUFFLENBQUMsS0FBSyxDQUFDO0tBQ2YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSCxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLFVBQWdCLE9BQU8sRUFBRSxjQUFjO0lBQzFFLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDakIsTUFBTSxFQUFFLE9BQU87UUFDZixNQUFNLEVBQUUsSUFBSTtRQUNaLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQztLQUNqQixDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVILEtBQUssQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsVUFBZ0IsSUFBSTtJQUN0RCxhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ2pCLE1BQU0sRUFBRSxTQUFTO1FBQ2pCLE1BQU0sRUFBRSxJQUFJO1FBQ1osS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDO0tBQ2QsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSCxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLFVBQWdCLFFBQVEsRUFBRSxRQUFRO0lBQ3JFLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDakIsTUFBTSxFQUFFLFNBQVM7UUFDakIsTUFBTSxFQUFFLElBQUk7UUFDWixLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUM7S0FDbEIsQ0FBQyxDQUFDO0lBQ0gsYUFBYSxDQUFDLElBQUksQ0FBQztRQUNqQixNQUFNLEVBQUUsT0FBTztRQUNmLE1BQU0sRUFBRSxJQUFJO1FBQ1osS0FBSyxFQUFFLENBQUMsUUFBUSxDQUFDO0tBQ2xCLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsVUFBZ0IsTUFBTTtJQUNoRSxrRUFBa0U7SUFDbEUsYUFBYSxDQUFDLElBQUksQ0FBQztRQUNqQixNQUFNLEVBQUUsU0FBUztRQUNqQixNQUFNLEVBQUUsSUFBSTtRQUNaLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7S0FDbkMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDSCxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQztJQUMzQyx5RUFBeUU7SUFDekUsYUFBYSxDQUFDLElBQUksQ0FBQztRQUNqQixNQUFNLEVBQUUsT0FBTztRQUNmLE1BQU0sRUFBRSxJQUFJO1FBQ1osS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztLQUNuQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVILFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFnQixLQUFLLEVBQUUsT0FBTztJQUM3RSxNQUFNLE1BQU0sR0FBRyxLQUFLLEtBQUssWUFBWSxJQUFJLEtBQUssS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUN4RixJQUFJLE1BQU0sRUFBRTtRQUNWLGFBQWEsQ0FBQyxJQUFJLENBQUM7WUFDakIsTUFBTSxFQUFFLE9BQU87WUFDZixNQUFNO1lBQ04sS0FBSyxFQUFFLENBQUMsT0FBTyxDQUFDO1NBQ2pCLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQyxDQUFDLENBQUMifQ==