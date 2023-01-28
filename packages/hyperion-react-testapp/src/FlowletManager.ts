import { FlowletManager as BaseFlowletManager } from "@hyperion/hyperion-flowlet/src/FlowletManager";
import { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";

export const FlowletManager = new BaseFlowletManager(Flowlet);
FlowletManager.push(new Flowlet("top"));
