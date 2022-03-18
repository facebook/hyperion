/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import "./global";
const devOptions = {
    getCallStack: () => [],
    logger: console,
};
export function assert(condition, message, options) {
    if (!condition) {
        const callStackGetter = options?.getCallStack ?? devOptions.getCallStack;
        const logger = options?.logger ?? devOptions.logger;
        const callStack = callStackGetter(2);
        if (callStack && callStack.length > 0) {
            logger.error(message, callStack);
        }
        else {
            logger.error(message);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXNzZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHO0FBRUgsT0FBTyxVQUFVLENBQUM7QUFTbEIsTUFBTSxVQUFVLEdBQXNCO0lBQ3BDLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFO0lBQ3RCLE1BQU0sRUFBRSxPQUFPO0NBQ2hCLENBQUE7QUFFRCxNQUFNLFVBQVUsTUFBTSxDQUFDLFNBQThCLEVBQUUsT0FBZSxFQUFFLE9BQWlCO0lBQ3ZGLElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDZCxNQUFNLGVBQWUsR0FBRyxPQUFPLEVBQUUsWUFBWSxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUM7UUFDekUsTUFBTSxNQUFNLEdBQUcsT0FBTyxFQUFFLE1BQU0sSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDO1FBQ3BELE1BQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVyQyxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNyQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztTQUNsQzthQUFNO1lBQ0wsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN2QjtLQUNGO0FBQ0gsQ0FBQyJ9