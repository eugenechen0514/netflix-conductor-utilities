import assert from 'assert';
import debugFun  from 'debug';
import {EventEmitter} from 'events';
import {forever, END} from 'run-forever';
import delay from 'delay';

import axios, {AxiosInstance} from 'axios';
import {PollTask, TaskState, UpdatingTaskResult} from "./";

const debug = debugFun('ConductorWorker[DEBUG]');
const debugError = debugFun('ConductorWorker[Error]');

interface ProcessingTask {
  taskId: string;
  done: boolean;
  start: number;
}

export interface ConductorWorkerOptions {
  url?: string;
  apiPath?: string;
  workerid?: string;
  maxConcurrent?: number;
  heartbeatInterval?: number;
}

export type WorkFunction<Result = void> = (input: any) => Promise<Result>;

class ConductorWorker<Result = void> extends EventEmitter {
  url: string;
  apiPath: string;
  workerid?: string;
  client: AxiosInstance;
  polling: boolean = false;
  maxConcurrent: number = Number.POSITIVE_INFINITY;
  runningTasks: ProcessingTask[] = [];
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

  pollAndWork(taskType: string, fn: WorkFunction<Result>) { // keep 'function'
    return (async () => {
      // NOTE: There is a potential problem which is 「poll task」 and 「ack task」 should be as soon as possible,
      //  if no two workers maybe deal with simultaneously when they poll the same task at the same time.

      // Poll for Worker task
      debug(`Poll a "${taskType}" task`);
      const {data: pullTask} = await this.client.get<PollTask | void>(`${this.apiPath}/tasks/poll/${taskType}?workerid=${this.workerid}`);
      if (!pullTask) {
        return;
      }
      const input = pullTask.inputData;
      const { workflowInstanceId, taskId } = pullTask;

      // Ack the Task
      debug(`Ack the "${taskType}" task`);
      await this.client.post<boolean>(`${this.apiPath}/tasks/${taskId}/ack?workerid=${this.workerid}`);

      // Record running task
      const runningTask = {
        taskId,
        done: false,
        start: Date.now(),
      };
      this.runningTasks.push(runningTask);
      debug(`Create runningTask: `, runningTask);

      const baseTaskInfo: UpdatingTaskResult = {
        workflowInstanceId,
        taskId,
      };

      // Working
      debug('Dealing with the task:', {workflowInstanceId, taskId});
      // const runningTask = this.__forceFindOneProcessingTask(taskId);
      return fn(input)
          .then(output => {
            debug('worker resolve');

            runningTask.done = true;
            debug(`Update runningTask:`, runningTask);
            return {
              ...baseTaskInfo,
              callbackAfterSeconds: (Date.now() - runningTask.start) / 1000,
              outputData: output,
              status: TaskState.completed,
            };
          })
          .catch((err) => {
            debug('worker reject', err);

            runningTask.done = true;
            debug(`Update runningTask:`, runningTask);
            return {
              ...baseTaskInfo,
              callbackAfterSeconds: (Date.now() - runningTask.start) / 1000,
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
            return this.client.post(`${this.apiPath}/tasks/`, updateTaskInfo)
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
        await delay(interval);
        debug(`Check the amount of running tasks: ${this.runningTasks.length}`);
        if(this.runningTasks.length < this.maxConcurrent) {
          this.pollAndWork(taskType, fn)
              .then((data: any) => {
                // debug(data);
              }, (err: any) => {
                debugError(err)
              });
        } else {
          debug(`Skip polling task because the work reaches the max amount of running tasks`);
        }
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
export {ConductorWorker};
