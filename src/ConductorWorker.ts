import assert from 'assert';
import debugFun  from 'debug';
import {EventEmitter} from 'events';
import {forever, END} from 'run-forever';
import delay from 'delay';

import axios, {AxiosInstance} from 'axios';
import {PollTask, RunningTaskCoreInfo, TaskState, UpdatingTaskResult} from "./";

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
    heartbeatInterval?: number;
}

export type WorkFunction<Result = void> = (input: any, runningTask: RunningTask<Result>) => Promise<Result>;

class RunningTask<Result = void> {
    options: RunningTaskCoreInfo;
    worker: ConductorWorker<Result>;
    done: boolean;
    start: number | undefined;

    constructor(worker: ConductorWorker<Result>, options: RunningTaskCoreInfo) {
        this.worker = worker;
        this.options = options;
        this.done = false;
    }

    updateTaskInfo(partialUpdateTaskInfo: Partial<UpdatingTaskResult> & {callbackAfterSeconds: number, status: TaskState}) {
        const updateTaskInfo = {...this.options, ...partialUpdateTaskInfo};

        const {client, apiPath} = this.worker;
        return client.post(`${apiPath}/tasks/`, updateTaskInfo);
    }

    startTask() {
        this.start = Date.now();
        this.done = false;
    }

    stopTask() {
        this.done = true;
    }
}

class ConductorWorker<Result = void> extends EventEmitter {
    url: string;
    apiPath: string;
    workerid?: string;
    client: AxiosInstance;
    polling: boolean = false;
    maxConcurrent: number = Number.POSITIVE_INFINITY;
    runningTasks: ProcessingTask<Result>[] = [];
    heartbeatInterval: number = 300000; //default: 5 min

    constructor(options: ConductorWorkerOptions = {}) {
        super();
        const {url = 'http://localhost:8080', apiPath = '/api', workerid = undefined, maxConcurrent, heartbeatInterval} = options;
        this.url = url;
        this.apiPath = apiPath;
        this.workerid = workerid;

        if(maxConcurrent) {
            this.maxConcurrent = maxConcurrent;
        }

        if(heartbeatInterval) {
            this.heartbeatInterval = heartbeatInterval;
        }

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

    pollAndWork(taskType: string, fn: WorkFunction<Result>) { // keep 'function'
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
            debug(`Ack the "${taskType}" task`);
            await this.client.post<boolean>(`${this.apiPath}/tasks/${taskId}/ack?workerid=${this.workerid}`);

            // Record running task
            const baseTaskInfo: RunningTaskCoreInfo = {
                workflowInstanceId,
                taskId,
            };

            const runningTask: ProcessingTask<Result> = {
                taskId,
                task: new RunningTask<Result>(this, baseTaskInfo),
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
                    debug(`Update runningTask:`, runningTask);
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
                    debug(`Update runningTask:`, runningTask);
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

    start(taskType: string, fn: WorkFunction<Result>, interval: number = 1000) {
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
