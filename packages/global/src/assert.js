import "./global";
var devOptions = {
    getCallStack: function () { return []; },
    logger: console
};
export function assert(condition, message, options) {
    var _a, _b;
    if (!condition) {
        var callStackGetter = (_a = options === null || options === void 0 ? void 0 : options.getCallStack) !== null && _a !== void 0 ? _a : devOptions.getCallStack;
        var logger = (_b = options === null || options === void 0 ? void 0 : options.logger) !== null && _b !== void 0 ? _b : devOptions.logger;
        var callStack = callStackGetter(2);
        if (callStack && callStack.length > 0) {
            logger.error(message, callStack);
        }
        else {
            logger.error(message);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXNzZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sVUFBVSxDQUFDO0FBU2xCLElBQU0sVUFBVSxHQUFzQjtJQUNwQyxZQUFZLEVBQUUsY0FBTSxPQUFBLEVBQUUsRUFBRixDQUFFO0lBQ3RCLE1BQU0sRUFBRSxPQUFPO0NBQ2hCLENBQUE7QUFFRCxNQUFNLFVBQVUsTUFBTSxDQUFDLFNBQWtCLEVBQUUsT0FBZSxFQUFFLE9BQWlCOztJQUMzRSxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsSUFBTSxlQUFlLEdBQUcsTUFBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsWUFBWSxtQ0FBSSxVQUFVLENBQUMsWUFBWSxDQUFDO1FBQ3pFLElBQU0sTUFBTSxHQUFHLE1BQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE1BQU0sbUNBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztRQUNwRCxJQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckMsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDckMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDbEM7YUFBTTtZQUNMLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDdkI7S0FDRjtBQUNILENBQUMifQ==