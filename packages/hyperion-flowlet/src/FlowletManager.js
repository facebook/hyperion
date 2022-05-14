/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
export class FlowletManager {
    flowletStack = [];
    top() {
        const last = this.flowletStack.length - 1;
        return last >= 0 ? this.flowletStack[last] : null;
    }
    push(flowlet, reason) {
        this.onPush.call(flowlet, reason);
        this.flowletStack.push(flowlet);
        return flowlet;
    }
    onPush = new Hook();
    /**
     * pop and return top of stack
     * @param flowlet if passed, asserts top matches the input
     * @returns top of the stack or null
     */
    pop(flowlet, reason) {
        let currTop = this.top();
        __DEV__ && assert(!flowlet || currTop === flowlet, `Incompatible top of the stack: expected({${flowlet?.name}}), actual({${currTop?.name}})`);
        this.flowletStack.pop();
        this.onPop.call(currTop, reason);
        return currTop;
    }
    onPop = new Hook();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmxvd2xldE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJGbG93bGV0TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFHdEMsTUFBTSxPQUFPLGNBQWM7SUFDakIsWUFBWSxHQUFRLEVBQUUsQ0FBQztJQUUvQixHQUFHO1FBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQzFDLE9BQU8sSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3BELENBQUM7SUFFRCxJQUFJLENBQUMsT0FBVSxFQUFFLE1BQWU7UUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFDUSxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQXlDLENBQUM7SUFFcEU7Ozs7T0FJRztJQUNILEdBQUcsQ0FBQyxPQUFXLEVBQUUsTUFBZTtRQUM5QixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDekIsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLE9BQU8sSUFBSSxPQUFPLEtBQUssT0FBTyxFQUFFLDRDQUE0QyxPQUFPLEVBQUUsSUFBSSxlQUFlLE9BQU8sRUFBRSxJQUFJLElBQUksQ0FBQyxDQUFDO1FBQzlJLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2pDLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFDUSxLQUFLLEdBQUcsSUFBSSxJQUFJLEVBQWdELENBQUM7Q0FDM0UifQ==