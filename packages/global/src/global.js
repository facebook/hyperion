import "./reference";
if (typeof global === "object"
    && typeof __DEV__ !== "boolean") {
    if (global?.process?.env?.JEST_WORKER_ID ||
        global?.process?.env?.NODE_ENV === 'development') {
        global["__DEV__"] = true;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2xvYmFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sYUFBYSxDQUFDO0FBVXJCLElBQ0UsT0FBTyxNQUFNLEtBQUssUUFBUTtPQUN2QixPQUFPLE9BQU8sS0FBSyxTQUFTLEVBQy9CO0lBQ0EsSUFDRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxjQUFjO1FBQ3BDLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLFFBQVEsS0FBSyxhQUFhLEVBQ2hEO1FBQ0EsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQztLQUMxQjtDQUNGIn0=