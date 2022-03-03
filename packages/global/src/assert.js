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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXNzZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sVUFBVSxDQUFDO0FBU2xCLE1BQU0sVUFBVSxHQUFzQjtJQUNwQyxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtJQUN0QixNQUFNLEVBQUUsT0FBTztDQUNoQixDQUFBO0FBRUQsTUFBTSxVQUFVLE1BQU0sQ0FBQyxTQUE4QixFQUFFLE9BQWUsRUFBRSxPQUFpQjtJQUN2RixJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsTUFBTSxlQUFlLEdBQUcsT0FBTyxFQUFFLFlBQVksSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDO1FBQ3pFLE1BQU0sTUFBTSxHQUFHLE9BQU8sRUFBRSxNQUFNLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztRQUNwRCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckMsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDckMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDbEM7YUFBTTtZQUNMLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDdkI7S0FDRjtBQUNILENBQUMifQ==