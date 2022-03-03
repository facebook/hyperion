/**
 * Copyright (c) Meta Platforms, Inc. and its affiliates. All Rights Reserved.
 */
import "./reference";
if (typeof global === "object"
    && typeof __DEV__ !== "boolean") {
    if (global?.process?.env?.JEST_WORKER_ID ||
        global?.process?.env?.NODE_ENV === 'development') {
        global["__DEV__"] = true;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2xvYmFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHO0FBRUgsT0FBTyxhQUFhLENBQUM7QUFVckIsSUFDRSxPQUFPLE1BQU0sS0FBSyxRQUFRO09BQ3ZCLE9BQU8sT0FBTyxLQUFLLFNBQVMsRUFDL0I7SUFDQSxJQUNFLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLGNBQWM7UUFDcEMsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsUUFBUSxLQUFLLGFBQWEsRUFDaEQ7UUFDQSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQzFCO0NBQ0YifQ==