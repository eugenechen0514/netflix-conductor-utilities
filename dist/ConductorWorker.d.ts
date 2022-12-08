/// <reference types="node" />
import { EventEmitter } from 'events';
import { Bucketchain, Superchain } from 'superchain';
import { AxiosInstance } from 'axios';
import { PollTask } from './';
import RunningTask, { KeepTaskTimerOptions } from './RunningTask';
interface ProcessingTask<OUTPUT = void, INPUT = any, CTX extends ConductorWorkerChainContext<any> = ConductorWorkerChainContext<OUTPUT, INPUT>> {
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
export interface ConductorWorkerChainBaseContext<OUTPUT = void, INPUT = any> {
    /**
     * input data from a polled task
     */
    input: INPUT;
    pollTask: PollTask;
    runningTask: RunningTask<OUTPUT, INPUT, this>;
    worker: ConductorWorker<OUTPUT, INPUT, this>;
}
export interface ConductorWorkerChainContext<OUTPUT = void, INPUT = any> extends ConductorWorkerChainBaseContext<OUTPUT, INPUT> {
    [key: string]: any;
}
export type WorkFunction<OUTPUT = void, INPUT = any, CTX extends ConductorWorkerChainBaseContext<OUTPUT, INPUT> = ConductorWorkerChainContext<OUTPUT, INPUT>> = (input: INPUT, runningTask: RunningTask<OUTPUT>, ctx: CTX) => Promise<OUTPUT>;
export type ConductorWorkerMiddlewareNext = (error?: Error) => void;
export type ConductorWorkerMiddleware<OUTPUT, INPUT, CTX extends ConductorWorkerChainBaseContext<OUTPUT, INPUT> = ConductorWorkerChainContext<OUTPUT, INPUT>> = (ctx: CTX, 
/**
 * invoke next() if use callback-version middleware
 * ignore next param if use promise-version middleware
 */
next: ConductorWorkerMiddlewareNext) => void | Promise<void>;
export type ConductorWorkerChainBucketName = 'input' | 'pre';
declare class ConductorWorker<OUTPUT = void, INPUT = any, CTX extends ConductorWorkerChainContext<any> = ConductorWorkerChainContext<OUTPUT, INPUT>> extends EventEmitter {
    url: string;
    apiPath: string;
    workerid?: string;
    client: AxiosInstance;
    polling: boolean;
    maxConcurrent: number;
    runningTasks: ProcessingTask<OUTPUT, INPUT, CTX>[];
    needAckTask: boolean;
    /**
     * chain bucket:
     *  pre
     * support by https://www.npmjs.com/package/superchain
     */
    bucketChain: Bucketchain;
    __preChain: Superchain;
    runningTaskOptions: Partial<KeepTaskTimerOptions>;
    constructor(options?: ConductorWorkerOptions);
    __canPollTask(): boolean;
    __registerMiddleware(chain: Superchain, middleware: ConductorWorkerMiddleware<OUTPUT, INPUT, CTX>): void;
    add(bucketName: ConductorWorkerChainBucketName, middleware: ConductorWorkerMiddleware<OUTPUT, INPUT, CTX>): void;
    /**
     *
     * middleware basic usage
     */
    use(middleware: ConductorWorkerMiddleware<OUTPUT, INPUT, CTX>): void;
    pollAndWork(taskType: string, fn: WorkFunction<OUTPUT, INPUT, CTX>): Promise<any>;
    start(taskType: string, fn: WorkFunction<OUTPUT, INPUT, CTX>, interval?: number): void;
    stop(): void;
}
export default ConductorWorker;
export { ConductorWorker, RunningTask };
