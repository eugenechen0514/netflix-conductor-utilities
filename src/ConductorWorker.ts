import debugFun from 'debug';
import { EventEmitter } from 'events';
import { END, forever } from 'run-forever';
import delay from 'delay';
import { Bucketchain, Superchain } from 'superchain';

import axios, { AxiosInstance } from 'axios';
import { PollTask, RunningTaskCoreInfo, TaskState, UpdatingTaskResult } from './';
import RunningTask, { KeepTaskTimerOptions } from './RunningTask';
import { getTaskCtx, initPreChainMiddleware } from './utils/chainUtils';
import isPromise from 'is-promise';

const debug = debugFun('ConductorWorker[DEBUG]');
const debugError = debugFun('ConductorWorker[Error]');

interface ProcessingTask<
  OUTPUT = void,
  INPUT = any,
  CTX extends ConductorWorkerChainContext<any> = ConductorWorkerChainContext<OUTPUT, INPUT>,
> {
  taskId: string;
  task: RunningTask<OUTPUT, INPUT, CTX>;
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

export interface ConductorWorkerChainContext<OUTPUT = void, INPUT = any, CTX = any> {
  /**
   * input data from a polled task
   */
  input: INPUT;
  pollTask: PollTask;
  runningTask: RunningTask<OUTPUT, INPUT, this>;
  worker: ConductorWorker<OUTPUT, INPUT, this>;
}

export type WorkFunction<OUTPUT = void, INPUT = any, CTX = ConductorWorkerChainContext<OUTPUT, INPUT>> = (
  input: INPUT,
  runningTask: RunningTask<OUTPUT>,
  ctx: CTX,
) => Promise<OUTPUT>;

export type ConductorWorkerMiddlewareNext = (error?: Error) => void;
export type ConductorWorkerMiddleware<CTX = ConductorWorkerChainContext> = (
  ctx: CTX,
  /**
   * invoke next() if use callback-version middleware
   * ignore next param if use promise-version middleware
   */
  next: ConductorWorkerMiddlewareNext,
) => void | Promise<void>;

export type ConductorWorkerChainBucketName = 'input' | 'pre';

class ConductorWorker<
  OUTPUT = void,
  INPUT = any,
  CTX extends ConductorWorkerChainContext<any> = ConductorWorkerChainContext<OUTPUT, INPUT>,
> extends EventEmitter {
  url: string;
  apiPath: string;
  workerid?: string;
  client: AxiosInstance;
  polling: boolean = false;
  maxConcurrent: number = Number.POSITIVE_INFINITY;
  runningTasks: ProcessingTask<OUTPUT, INPUT, CTX>[] = [];
  needAckTask: boolean = false;

  /**
   * chain bucket:
   *  pre
   * support by https://www.npmjs.com/package/superchain
   */
  bucketChain = new Bucketchain();
  __preChain: Superchain;

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

    // chain
    this.__preChain = initPreChainMiddleware(this.bucketChain);

    this.client = axios.create({
      baseURL: this.url,
      responseType: 'json',
    });
  }

  __canPollTask() {
    debug(`Check the amount of running tasks: ${this.runningTasks.length}`);
    if (this.runningTasks.length >= this.maxConcurrent) {
      debug(`Skip polling task because the work reaches the max amount of running tasks`);
      return false;
    }
    return true;
  }

  __registerMiddleware(chain: Superchain, middleware: ConductorWorkerMiddleware<CTX>) {
    chain.add(async function (_ctx: any, next: ConductorWorkerMiddlewareNext) {
      // @ts-ignore
      const ctx = getTaskCtx(this);

      // for callback version
      const handleNext = function (err?: Error) {
        if (err) {
          throw err;
        } else {
          next();
        }
      };

      // for promise version
      const result = middleware(ctx, handleNext);
      if (isPromise(result)) {
        result.then(() => {
          next();
        });
      }
      return result;
    });
  }

  add(bucketName: ConductorWorkerChainBucketName, middleware: ConductorWorkerMiddleware<CTX>) {
    if (bucketName === 'pre') {
      return this.__registerMiddleware(this.__preChain, middleware);
    }
    throw new Error(`unknown bucketName: ${bucketName}`);
  }

  /**
   *
   * middleware basic usage
   */
  use(middleware: ConductorWorkerMiddleware<CTX>) {
    return this.add('pre', middleware);
  }

  pollAndWork(taskType: string, fn: WorkFunction<OUTPUT, INPUT, CTX>) {
    // keep 'function'
    return (async () => {
      // Poll for Worker task
      debug(`Poll a "${taskType}" task`);
      const { data: pollTask } = await this.client.get<PollTask | void>(
        `${this.apiPath}/tasks/poll/${taskType}?workerid=${this.workerid}`,
      );
      if (!pollTask) {
        debug(`No more "${taskType}" tasks`);
        return;
      }
      debug(`Polled a "${taskType}" task: `, pollTask);
      const input = pollTask.inputData;
      const { workflowInstanceId, taskId } = pollTask;

      // Ack the task
      if (this.needAckTask) {
        debug(`Ack the "${taskType}" task`);
        await this.client.post<boolean>(`${this.apiPath}/tasks/${taskId}/ack?workerid=${this.workerid}`);
      }

      // Record running task
      const baseTaskInfo: RunningTaskCoreInfo = {
        workflowInstanceId,
        taskId,
      };

      const processingTask: ProcessingTask<OUTPUT, INPUT, CTX> = {
        taskId,
        task: new RunningTask<OUTPUT, INPUT, CTX>(this, { ...baseTaskInfo, ...this.runningTaskOptions }),
      };
      this.runningTasks.push(processingTask);
      debug(`Create runningTask: `, processingTask);

      // Working
      debug('Dealing with the task:', { workflowInstanceId, taskId });
      // const processingTask = this.__forceFindOneProcessingTask(taskId);
      processingTask.task.startTask();

      // Processing
      const initCtx: ConductorWorkerChainContext<OUTPUT, INPUT, CTX> = {
        input,
        pollTask,
        runningTask: processingTask.task,
        worker: this,
      };
      return this.bucketChain
        .run(initCtx)
        .then((chainCtx: any) => {
          // get task ctx
          const taskCtx = getTaskCtx(chainCtx);
          const { input, runningTask } = taskCtx;

          // user process
          return fn(input, runningTask, taskCtx).then((output) => {
            debug('worker resolve');

            runningTask.stopTask();
            debug(`Resolve runningTask:`, processingTask);
            return {
              ...baseTaskInfo,
              callbackAfterSeconds: 0,
              outputData: output,
              status: TaskState.completed,
            };
          });
        })
        .catch((err: any) => {
          debug('worker reject', err);

          processingTask.task.stopTask();
          debug(`Reject runningTask:`, processingTask);
          return {
            ...baseTaskInfo,
            callbackAfterSeconds: 0,
            reasonForIncompletion: String(err), // If failed, reason for failure
            status: TaskState.failed,
          };
        })
        .then((updateTaskInfo: Partial<UpdatingTaskResult> & { status: TaskState }) => {
          // release running task
          this.runningTasks = this.runningTasks.filter((task) => task.taskId !== updateTaskInfo.taskId);
          debug(`Change the amount of running tasks: ${this.runningTasks.length}`);

          // Return response, add logs
          debug('update task info: taskId:' + taskId);
          return processingTask.task
            .updateTaskInfo(updateTaskInfo)
            .then((result) => {
              // debug(result.data);
            })
            .catch((err) => {
              debugError(err); // resolve
            });
        });
    })();
  }

  start(taskType: string, fn: WorkFunction<OUTPUT, INPUT, CTX>, interval: number = 1000) {
    this.polling = true;

    // start polling
    debug(`Start polling taskType = ${taskType}, poll-interval = ${interval}, maxConcurrent = ${this.maxConcurrent}`);
    forever(async () => {
      if (this.polling) {
        if (this.__canPollTask()) {
          this.pollAndWork(taskType, fn).then(
            (data: any) => {
              // debug(data);
            },
            (err: any) => {
              debugError(err);
            },
          );
        }
        await delay(interval);
      } else {
        debug(`Stop polling: taskType = ${taskType}`);
        return END;
      }
    });
  }

  stop() {
    this.polling = false;
  }
}

export default ConductorWorker;
export { ConductorWorker, RunningTask };
