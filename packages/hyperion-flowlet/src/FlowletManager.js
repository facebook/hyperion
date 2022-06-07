/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
import { isIntercepted } from "@hyperion/hyperion-core/src/intercept";
import { interceptEventListener, isEventListenerObject } from "@hyperion/hyperion-dom/src/IEventListener";
const IS_SETUP_PROP_NAME = `__isSetup`;
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
        // __DEV__ && assert(!flowlet || currTop === flowlet, `Incompatible top of the stack: expected({${flowlet?.name}}), actual({${currTop?.name}})`);
        __DEV__ && assert(!!flowlet, `Cannot pop undefined flowlet from top of the stack: ${currTop?.fullName()}`);
        if (currTop === flowlet) {
            this.flowletStack.pop();
        }
        else {
            this.flowletStack = this.flowletStack.filter(f => f !== flowlet);
        }
        this.onPop.call(currTop, reason);
        return currTop;
    }
    onPop = new Hook();
    wrap(listener, apiName) {
        if (!listener) {
            return listener;
        }
        const currentFLowlet = this.top();
        if (!currentFLowlet) {
            return listener;
        }
        const funcInterceptor = interceptEventListener(listener);
        if (!funcInterceptor[IS_SETUP_PROP_NAME]) {
            funcInterceptor[IS_SETUP_PROP_NAME] = true;
            // funcInterceptor.onArgsObserverAdd(() => {
            //   this.push(currentFLowlet);
            // });
            // funcInterceptor.onValueObserverAdd(() => {
            //   this.pop(currentFLowlet);
            // })
            const flowletManager = this;
            funcInterceptor.setCustom(function () {
                const handler = funcInterceptor.getOriginal();
                if (flowletManager.top() === currentFLowlet) {
                    return handler.apply(this, arguments);
                }
                let res;
                let flowlet; // using this extra variable to enable .push to change the value if needed
                try {
                    flowlet = flowletManager.push(currentFLowlet, apiName);
                    res = handler.apply(this, arguments);
                }
                catch (e) {
                    console.error('callback throw', e);
                }
                finally {
                    flowletManager.pop(flowlet, apiName);
                }
                return res;
            });
        }
        return isEventListenerObject(listener) ? listener : funcInterceptor.interceptor;
    }
    unwrap(listener) {
        if (listener && !isEventListenerObject(listener) && isIntercepted(listener)) {
            const funcInterceptor = interceptEventListener(listener);
            return funcInterceptor.getOriginal();
        }
        return listener;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmxvd2xldE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJGbG93bGV0TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDdEMsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHVDQUF1QyxDQUFDO0FBQ3RFLE9BQU8sRUFBZ0Isc0JBQXNCLEVBQUUscUJBQXFCLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUl4SCxNQUFNLGtCQUFrQixHQUFHLFdBQVcsQ0FBQztBQUV2QyxNQUFNLE9BQU8sY0FBYztJQUNqQixZQUFZLEdBQVEsRUFBRSxDQUFDO0lBRS9CLEdBQUc7UUFDRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDMUMsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDcEQsQ0FBQztJQUVELElBQUksQ0FBQyxPQUFVLEVBQUUsTUFBZTtRQUM5QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEMsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUNRLE1BQU0sR0FBRyxJQUFJLElBQUksRUFBeUMsQ0FBQztJQUVwRTs7OztPQUlHO0lBQ0gsR0FBRyxDQUFDLE9BQVcsRUFBRSxNQUFlO1FBQzlCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN6QixpSkFBaUo7UUFDakosT0FBTyxJQUFJLE1BQU0s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