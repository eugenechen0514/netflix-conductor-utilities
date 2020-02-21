import debugFun  from 'debug';
import {EventEmitter} from 'events';
import {forever, END} from 'run-forever';
import delay from 'delay';

import axios, {AxiosInstance} from 'axios';
import {PollTask, TaskState, UpdatingTaskResult} from "./";

const debug = debugFun('ConductorWorker[DEBUG]');
const debugError = debugFun('ConductorWorker[Error]');

export interface ConductorWorkerOptions {
  url?: string;
  apiPath?: string;
  workerid?: string;
}

export type WorkFunction<Result = void> = (input: any) => Promise<Result>;

class ConductorWorker<Result = void> extends EventEmitter {
  url: string;
  apiPath: string;
  workerid?: string;
  client: AxiosInstance;
  polling: boolean = false;

  constructor(options: ConductorWorkerOptions = {}) {
    super();
    const {url = 'http://localhost:8080', apiPath = '/api', workerid = undefined} = options;
    this.url = url;
    this.apiPath = apiPath;
    this.workerid = workerid;

    this.client = axios.create({
      baseURL: this.url,
      responseType: 'json',
    });
  }

  pollAndWork(taskType: string, fn: WorkFunction<Result>) { // keep 'function'
    return (async () => {
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

      const t1 = Date.now();
      const baseTaskInfo: UpdatingTaskResult = {
        workflowInstanceId,
        taskId,
      };

      // Working
      return fn(input)
          .then(output => {
            debug('worker resolve');
            return {
              ...baseTaskInfo,
              callbackAfterSeconds: (Date.now() - t1) / 1000,
              outputData: output,
              status: TaskState.completed,
            };
          })
          .catch((err) => {
            debug('worker reject', err);
            return {
              ...baseTaskInfo,
              callbackAfterSeconds: (Date.now() - t1) / 1000,
              reasonForIncompletion: String(err), // If failed, reason for failure
              status: TaskState.failed,
            };
          })
          .then(updateTaskInfo => {
            // Return response, add logs
            debug('update task info');
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
    debug(`Start polling taskType = ${taskType}, poll-interval = ${interval}`);
    forever(async () => {
      if (this.polling) {
        await delay(interval);
        this.pollAndWork(taskType, fn)
            .then((data: any) => {
              // debug(data);
            }, (err: any) => {
              debugError(err)
            })
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
