/// <reference types="node" />
import { RunningTaskCoreInfo, TaskState, UpdatingTaskResult } from './types';
import ConductorWorker, { ConductorWorkerChainContext } from './ConductorWorker';
export interface KeepTaskTimerOptions {
    keepAliveTimer: {
        enable: boolean;
        interval: number;
        callbackAfterSeconds: number;
    };
}
export type RunningTaskOptions = RunningTaskCoreInfo & KeepTaskTimerOptions;
export default class RunningTask<OUTPUT = void, INPUT = any, CTX extends ConductorWorkerChainContext<any> = ConductorWorkerChainContext<OUTPUT, INPUT>> {
    options: RunningTaskOptions;
    worker: ConductorWorker<OUTPUT, INPUT, CTX>;
    done: boolean;
    start: number | undefined;
    keepRunningTimer: NodeJS.Timeout | undefined;
    constructor(worker: ConductorWorker<OUTPUT, INPUT, CTX>, options: RunningTaskCoreInfo & Partial<KeepTaskTimerOptions>);
    updateTaskInfo(partialUpdateTaskInfo: Partial<UpdatingTaskResult> & {
        status: TaskState;
    }): Promise<import("axios").AxiosResponse<any, any>>;
    private __setKeepTaskTimerForNotifyConductor;
    private __clearKeepTaskTimerForNotifyConductor;
    startTask(): void;
    sendLog(msg: string, others?: Partial<UpdatingTaskResult>): Promise<import("axios").AxiosResponse<any, any>>;
    stopTask(): void;
}
