import debugFun from 'debug';
import {EventEmitter} from 'events';
import {END, forever} from 'run-forever';
import delay from 'delay';

import axios, {AxiosInstance} from 'axios';
import {PollTask, RunningTaskCoreInfo, TaskState} from "./";
import RunningTask, {KeepTaskTimerOptions} from './RunningTask';

const debug = debugFun('ConductorWorker[DEBUG]');
const debugError = debugFun('ConductorWorker[Error]');

interface ProcessingTask<Result = void> {
    taskId: string;
    task: RunningTask<Result>;
}

export interface ConductorWorkerOptions {
    url?: string;
    apiPath?: string;
    workerid?: string;
    maxConcurrent?: number;
    runningTaskOptions?: Partial<KeepTaskTimerOptions>;

    /**
     * Because the “POST /tasks/{taskId}/ack“ api was removed in ConductorV3,
     * workers have been no longer to acknowledge a Conductor Server.
     */
    needAckTask?: boolean;
}

export type WorkFunction<OUTPUT = void, INPUT = any> = (input: INPUT, runningTask: RunningTask<OUTPUT>) => Promise<OUTPUT>;

class ConductorWorker<OUTPUT = void, INPUT = any> extends EventEmitter {
    url: string;
    apiPath: string;
    workerid?: string;
    client: AxiosInstance;
    polling: boolean = false;
    maxConcurrent: number = Number.POSITIVE_INFINITY;
    runningTasks: ProcessingTask<OUTPUT>[] = [];
    needAckTask: boolean = false;

    runningTaskOptions: Partial<KeepTaskTimerOptions>;

    constructor(options: ConductorWorkerOptions = {}) {
        super();
        const {
            url = 'http://localhost:8080',
            apiPath = '/api',
            workerid = undefined,
            maxConcurrent,
            runningTaskOptions = {},
            needAckTask,
        } = options;
        this.url = url;
        this.apiPath = apiPath;
        this.workerid = workerid;
        this.runningTaskOptions = runningTaskOptions;

        maxConcurrent && (this.maxConcurrent = maxConcurrent);
        needAckTask && (this.needAckTask = needAckTask);

        this.client = axios.create({
            baseURL: this.url,
            responseType: 'json',
        });
    }

    __canPollTask() {
        debug(`Check the amount of running tasks: ${this.runningTasks.length}`);
        if(this.runningTasks.length >= this.maxConcurrent) {
            debug(`Skip polling task because the work reaches the max amount of running tasks`);
            return false;
        }
        return true
    }

    pollAndWork(taskType: string, fn: WorkFunction<OUTPUT, INPUT>) { // keep 'function'
        return (async () => {
            // Poll for Worker task
            debug(`Poll a "${taskType}" task`);
            const {data: pullTask} = await this.client.get<PollTask | void>(`${this.apiPath}/tasks/poll/${taskType}?workerid=${this.workerid}`);
            if (!pullTask) {
                debug(`No more "${taskType}" tasks`);
                return;
            }
            debug(`Polled a "${taskType}" task: `, pullTask);
            const input = pullTask.inputData;
            const { workflowInstanceId, taskId } = pullTask;

            // Ack the task
            if(this.needAckTask) {
                debug(`Ack the "${taskType}" task`);
                await this.client.post<boolean>(`${this.apiPath}/tasks/${taskId}/ack?workerid=${this.workerid}`);
            }

            // Record running task
            const baseTaskInfo: RunningTaskCoreInfo = {
                workflowInstanceId,
                taskId,
            };

            const runningTask: ProcessingTask<OUTPUT> = {
                taskId,
                task: new RunningTask<OUTPUT>(this, {...baseTaskInfo, ...this.runningTaskOptions}),
            };
            this.runningTasks.push(runningTask);
            debug(`Create runningTask: `, runningTask);

            // Working
            debug('Dealing with the task:', {workflowInstanceId, taskId});
            // const runningTask = this.__forceFindOneProcessingTask(taskId);
            runningTask.task.startTask();
            return fn(input, runningTask.task)
                .then(output => {
                    debug('worker resolve');

                    runningTask.task.stopTask();
                    debug(`Resolve runningTask:`, runningTask);
                    return {
                        ...baseTaskInfo,
                        callbackAfterSeconds: 0,
                        outputData: output,
                        status: TaskState.completed,
                    };
                })
                .catch((err) => {
                    debug('worker reject', err);

                    runningTask.task.stopTask();
                    debug(`Reject runningTask:`, runningTask);
                    return {
                        ...baseTaskInfo,
                        callbackAfterSeconds: 0,
                        reasonForIncompletion: String(err), // If failed, reason for failure
                        status: TaskState.failed,
                    };
                })
                .then(updateTaskInfo => {
                    // release running task
                    this.runningTasks = this.runningTasks.filter(task => task.taskId !== updateTaskInfo.taskId);
                    debug(`Change the amount of running tasks: ${this.runningTasks.length}`);

                    // Return response, add logs
                    debug('update task info: taskId:' + taskId);
                    return runningTask.task.updateTaskInfo(updateTaskInfo)
                        .then(result => {
                            // debug(result.data);
                        })
                        .catch(err => {
                            debugError(err); // resolve
                        });
                })
        })();
    }

    start(taskType: string, fn: WorkFunction<OUTPUT>, interval: number = 1000) {
        this.polling = true;
        debug(`Start polling taskType = ${taskType}, poll-interval = ${interval}, maxConcurrent = ${this.maxConcurrent}`);
        forever(async () => {
            if (this.polling) {
                if(this.__canPollTask()) {
                    this.pollAndWork(taskType, fn)
                        .then((data: any) => {
                            // debug(data);
                        }, (err: any) => {
                            debugError(err)
                        });
                }
                await delay(interval);
            } else {
                debug(`Stop polling: taskType = ${taskType}`);
                return END;
            }
        })
    }

    stop() {
        this.polling = false
    }
}

export default ConductorWorker;
export {ConductorWorker, RunningTask};
