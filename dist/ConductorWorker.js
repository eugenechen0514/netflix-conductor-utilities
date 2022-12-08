"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunningTask = exports.ConductorWorker = void 0;
const debug_1 = __importDefault(require("debug"));
const events_1 = require("events");
const run_forever_1 = require("run-forever");
const delay_1 = __importDefault(require("delay"));
const superchain_1 = require("superchain");
const axios_1 = __importDefault(require("axios"));
const _1 = require("./");
const RunningTask_1 = __importDefault(require("./RunningTask"));
exports.RunningTask = RunningTask_1.default;
const chainUtils_1 = require("./utils/chainUtils");
const is_promise_1 = __importDefault(require("is-promise"));
const debug = (0, debug_1.default)('ConductorWorker[DEBUG]');
const debugError = (0, debug_1.default)('ConductorWorker[Error]');
class ConductorWorker extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.polling = false;
        this.maxConcurrent = Number.POSITIVE_INFINITY;
        this.runningTasks = [];
        this.needAckTask = false;
        /**
         * chain bucket:
         *  pre
         * support by https://www.npmjs.com/package/superchain
         */
        this.bucketChain = new superchain_1.Bucketchain();
        const { url = 'http://localhost:8080', apiPath = '/api', workerid = undefined, maxConcurrent, runningTaskOptions = {}, needAckTask, } = options;
        this.url = url;
        this.apiPath = apiPath;
        this.workerid = workerid;
        this.runningTaskOptions = runningTaskOptions;
        maxConcurrent && (this.maxConcurrent = maxConcurrent);
        needAckTask && (this.needAckTask = needAckTask);
        // chain
        this.__preChain = (0, chainUtils_1.initPreChainMiddleware)(this.bucketChain);
        this.client = axios_1.default.create({
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
    __registerMiddleware(chain, middleware) {
        chain.add(function (_ctx, next) {
            return __awaiter(this, void 0, void 0, function* () {
                // @ts-ignore
                const ctx = (0, chainUtils_1.getTaskCtx)(this);
                // for callback version
                const handleNext = function (err) {
                    if (err) {
                        throw err;
                    }
                    else {
                        next();
                    }
                };
                // for promise version
                const result = middleware(ctx, handleNext);
                if ((0, is_promise_1.default)(result)) {
                    result.then(() => {
                        next();
                    });
                }
                return result;
            });
        });
    }
    add(bucketName, middleware) {
        if (bucketName === 'pre') {
            return this.__registerMiddleware(this.__preChain, middleware);
        }
        throw new Error(`unknown bucketName: ${bucketName}`);
    }
    /**
     *
     * middleware basic usage
     */
    use(middleware) {
        return this.add('pre', middleware);
    }
    pollAndWork(taskType, fn) {
        // keep 'function'
        return (() => __awaiter(this, void 0, void 0, function* () {
            // Poll for Worker task
            debug(`Poll a "${taskType}" task`);
            const { data: pollTask } = yield this.client.get(`${this.apiPath}/tasks/poll/${taskType}?workerid=${this.workerid}`);
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
                yield this.client.post(`${this.apiPath}/tasks/${taskId}/ack?workerid=${this.workerid}`);
            }
            // Record running task
            const baseTaskInfo = {
                workflowInstanceId,
                taskId,
            };
            const processingTask = {
                taskId,
                task: new RunningTask_1.default(this, Object.assign(Object.assign({}, baseTaskInfo), this.runningTaskOptions)),
            };
            this.runningTasks.push(processingTask);
            debug(`Create runningTask: `, processingTask);
            // Working
            debug('Dealing with the task:', { workflowInstanceId, taskId });
            // const processingTask = this.__forceFindOneProcessingTask(taskId);
            processingTask.task.startTask();
            // Processing
            const initCtx = {
                input,
                pollTask,
                runningTask: processingTask.task,
                worker: this,
            };
            return this.bucketChain
                .run(initCtx)
                .then((chainCtx) => {
                // get task ctx
                const taskCtx = (0, chainUtils_1.getTaskCtx)(chainCtx);
                const { input, runningTask } = taskCtx;
                // user process
                return fn(input, runningTask, taskCtx).then((output) => {
                    debug('worker resolve');
                    runningTask.stopTask();
                    debug(`Resolve runningTask:`, processingTask);
                    return Object.assign(Object.assign({}, baseTaskInfo), { callbackAfterSeconds: 0, outputData: output, status: _1.TaskState.completed });
                });
            })
                .catch((err) => {
                debug('worker reject', err);
                processingTask.task.stopTask();
                debug(`Reject runningTask:`, processingTask);
                return Object.assign(Object.assign({}, baseTaskInfo), { callbackAfterSeconds: 0, reasonForIncompletion: String(err), status: _1.TaskState.failed });
            })
                .then((updateTaskInfo) => {
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
        }))();
    }
    start(taskType, fn, interval = 1000) {
        this.polling = true;
        // start polling
        debug(`Start polling taskType = ${taskType}, poll-interval = ${interval}, maxConcurrent = ${this.maxConcurrent}`);
        (0, run_forever_1.forever)(() => __awaiter(this, void 0, void 0, function* () {
            if (this.polling) {
                if (this.__canPollTask()) {
                    this.pollAndWork(taskType, fn).then((data) => {
                        // debug(data);
                    }, (err) => {
                        debugError(err);
                    });
                }
                yield (0, delay_1.default)(interval);
            }
            else {
                debug(`Stop polling: taskType = ${taskType}`);
                return run_forever_1.END;
            }
        }));
    }
    stop() {
        this.polling = false;
    }
}
exports.ConductorWorker = ConductorWorker;
exports.default = ConductorWorker;
//# sourceMappingURL=ConductorWorker.js.map