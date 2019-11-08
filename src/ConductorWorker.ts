import debugFun  from 'debug';
import {EventEmitter} from 'events';
import {forever, END} from 'run-forever';
import delay from 'delay';

import axios, {AxiosInstance} from 'axios';
import {PollTask, TaskState, UpdatingTaskResult} from "../";

const debug = debugFun('ConductorWorker');
const debugError = debugFun('ConductorWorker');

export interface ConductorWorkerOptions {
  url?: string;
  apiPath?: string;
  workerid?: string;
}

export type WorkFunction<Result = void> = (input: any) => Promise<Result>;

class ConductorWorker extends EventEmitter {
  url: string;
  apiPath: string;
  workerid?: string;
  client: AxiosInstance;
  working: boolean = false;

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

  pollAndWork(taskType: string, fn: WorkFunction) { // keep 'function'
    return (async () => {
      // Poll for Worker task
      const {data: pullTask} = await this.client.get<PollTask | void>(`${this.apiPath}/tasks/poll/${taskType}?workerid=${this.workerid}`);
      if (!pullTask) {
        return;
      }
      const input = pullTask.inputData;
      const { workflowInstanceId, taskId } = pullTask;

      // Ack the Task
      const {data: obj} = await this.client.post<boolean>(`${this.apiPath}/tasks/${taskId}/ack?workerid=${this.workerid}`);
      if (obj !== true) {
        return;
      }

      const t1 = Date.now();
      const baseTaskInfo: UpdatingTaskResult = {
        workflowInstanceId,
        taskId,
      };

      // Working
      return fn(input)
          .then(output => {
            return {
              ...baseTaskInfo,
              callbackAfterSeconds: (Date.now() - t1) / 1000,
              outputData: output,
              status: TaskState.completed,
            };
          })
          .catch((err) => {
            return {
              ...baseTaskInfo,
              callbackAfterSeconds: (Date.now() - t1) / 1000,
              reasonForIncompletion: String(err), // If failed, reason for failure
              status: TaskState.failed,
            };
          })
          .then(updateTaskInfo => {
            // Return response, add logs
            return this.client.post(`${this.apiPath}/tasks/`, updateTaskInfo)
                .then(result => {
                  debug(result);
                })
                .catch(err => {
                  debugError(err); // resolve
                });
          })

    })();
  }

  start(taskType: string, fn: WorkFunction, interval: number = 1000) {
    this.working = true;
    debug(`Start worker: taskType = ${taskType}, poll-interval = ${interval}`);
    forever(async () => {
      if (this.working) {
        await delay(interval);
        debug(`Poll "${taskType}" task`);
        this.pollAndWork(taskType, fn)
            .then(data => {
              // debug(data);
            }, (err) => {
              debugError(err)
            })
      } else {
        debug(`End worker: taskType = ${taskType}`);
        return END;
      }
    })
  }

  stop() {
    this.working = false
  }
}

export default ConductorWorker;
export {ConductorWorker};
