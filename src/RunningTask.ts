import {RunningTaskCoreInfo, TaskState, UpdatingTaskResult} from "./types";
import ConductorWorker from "./ConductorWorker";
import debugFun from "debug";

const debug = debugFun('RunningTask[DEBUG]');
const debugError = debugFun('RunningTask[Error]');

interface KeepTaskTimerOptions {
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

export type RunningTaskOptions = RunningTaskCoreInfo & KeepTaskTimerOptions;

export default class RunningTask<Result = void> {
    options: RunningTaskOptions;
    worker: ConductorWorker<Result>;
    done: boolean;
    start: number | undefined;
    keepRunningTimer: NodeJS.Timeout | undefined;

    constructor(worker: ConductorWorker<Result>, options: RunningTaskCoreInfo & Partial<KeepTaskTimerOptions>) {
        this.worker = worker;

        const {interval = 10000, callbackAfterSeconds = 60} = options;
        this.options = {...options, interval, callbackAfterSeconds};
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
        debug(`start a keeping-task timer: ${this.options.interval}`);
        this.keepRunningTimer = setInterval(() => {
            const callbackAfterSeconds = this.options.callbackAfterSeconds;
            debug(`notify keep-task: callbackAfterSeconds: ${callbackAfterSeconds}`);
            this.updateTaskInfo({
                status: TaskState.inProgress,
                callbackAfterSeconds,
            })
                .catch(error => {
                    debugError(error);
                })
        }, this.options.interval);
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

        this.__setKeepTaskTimerForNotifyConductor();
    }

    async sendLog(msg: string, status: TaskState = TaskState.inProgress) {
        return this.updateTaskInfo({
            status,
            callbackAfterSeconds: this.options.callbackAfterSeconds,
            logs: [
                {log: msg, createdTime: Date.now()},
            ]
        });
    }

    stopTask() {
        debug('stop a task');
        this.__clearKeepTaskTimerForNotifyConductor();
        this.done = true;
    }
}
