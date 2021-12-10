import {RunningTaskCoreInfo, TaskState, UpdatingTaskResult} from "./types";
import ConductorWorker from "./ConductorWorker";
import debugFun from "debug";

const debug = debugFun('RunningTask[DEBUG]');
const debugError = debugFun('RunningTask[Error]');

export interface KeepTaskTimerOptions {
    keepAliveTimer: {
        enable: boolean;

        // ms
        // need to " < responseTimeoutSeconds"
        // Ref: https://netflix.github.io/conductor/configuration/taskdef/#task-definition
        // default: 10000
        interval: number;

        // second
        // need to " < responseTimeoutSeconds"
        // Ref: https://netflix.github.io/conductor/configuration/taskdef/#task-definition
        // default: 60
        callbackAfterSeconds: number;
    }
}

export type RunningTaskOptions = RunningTaskCoreInfo & KeepTaskTimerOptions;

export default class RunningTask<Result = void> {
    options: RunningTaskOptions;
    worker: ConductorWorker<Result>;
    done: boolean;
    start: number | undefined;
    keepRunningTimer: NodeJS.Timeout | undefined;

    constructor(worker: ConductorWorker<Result>, options: RunningTaskCoreInfo & Partial<KeepTaskTimerOptions>) {
        this.worker = worker;

        // keepAliveTimer options
        const {enable = false, interval = 10000, callbackAfterSeconds = 60} = options?.keepAliveTimer || {};
        this.options = {...options, keepAliveTimer: {enable, interval, callbackAfterSeconds}};
        this.done = false;
    }

    updateTaskInfo(partialUpdateTaskInfo: Partial<UpdatingTaskResult> & {status: TaskState}) {
        const updateTaskInfo = {...this.options, ...partialUpdateTaskInfo};

        const {client, apiPath} = this.worker;
        return client.post(`${apiPath}/tasks/`, updateTaskInfo);
    }

    private __setKeepTaskTimerForNotifyConductor() {
        // clean old timer
        this.__clearKeepTaskTimerForNotifyConductor();

        // new a timer
        // notify conductor: task is still running, and not put the queue back
        debug(`start a keeping-task timer: ${this.options.keepAliveTimer.interval}`);
        this.keepRunningTimer = setInterval(() => {
            const callbackAfterSeconds = this.options.keepAliveTimer.callbackAfterSeconds;
            debug(`notify keep-task: callbackAfterSeconds: ${callbackAfterSeconds}`);
            this.updateTaskInfo({
                status: TaskState.inProgress,
                callbackAfterSeconds,
            })
                .catch(error => {
                    debugError(error);
                })
        }, this.options.keepAliveTimer.interval);
    }

    private __clearKeepTaskTimerForNotifyConductor() {
        debug('clear a keeping-task timer');
        if (this.keepRunningTimer) {
            clearInterval(this.keepRunningTimer);
            this.keepRunningTimer = undefined;
        }
    }

    startTask() {
        debug('start a task');
        this.start = Date.now();
        this.done = false;

        this.options.keepAliveTimer.enable && this.__setKeepTaskTimerForNotifyConductor();
    }

    async sendLog(msg: string, others: Partial<UpdatingTaskResult> = {}) {
        const otherInfo: Partial<UpdatingTaskResult> & {status: TaskState} = {
            status: TaskState.inProgress,
            ...others,
        };
        if(this.options.keepAliveTimer.enable) {
            otherInfo.callbackAfterSeconds = this.options.keepAliveTimer.callbackAfterSeconds;
        }
        return this.updateTaskInfo({
            logs: [
                {log: msg, createdTime: Date.now()},
            ],
            ...otherInfo,
        });
    }

    stopTask() {
        debug('stop a task');
        this.options.keepAliveTimer.enable && this.__clearKeepTaskTimerForNotifyConductor();
        this.done = true;
    }
}
