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
const axios_1 = __importDefault(require("axios"));
const _1 = require("./");
const RunningTask_1 = __importDefault(require("./RunningTask"));
exports.RunningTask = RunningTask_1.default;
const debug = debug_1.default('ConductorWorker[DEBUG]');
const debugError = debug_1.default('ConductorWorker[Error]');
class ConductorWorker extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.polling = false;
        this.maxConcurrent = Number.POSITIVE_INFINITY;
        this.runningTasks = [];
        this.heartbeatInterval = 300000; //default: 5 min
        const { url = 'http://localhost:8080', apiPath = '/api', workerid = undefined, maxConcurrent, heartbeatInterval, runningTaskOptions = {} } = options;
        this.url = url;
        this.apiPath = apiPath;
        this.workerid = workerid;
        this.runningTaskOptions = runningTaskOptions;
        if (maxConcurrent) {
            this.maxConcurrent = maxConcurrent;
        }
        if (heartbeatInterval) {
            this.heartbeatInterval = heartbeatInterval;
        }
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
    pollAndWork(taskType, fn) {
        return (() => __awaiter(this, void 0, void 0, function* () {
            // Poll for Worker task
            debug(`Poll a "${taskType}" task`);
            const { data: pullTask } = yield this.client.get(`${this.apiPath}/tasks/poll/${taskType}?workerid=${this.workerid}`);
            if (!pullTask) {
                debug(`No more "${taskType}" tasks`);
                return;
            }
            debug(`Polled a "${taskType}" task: `, pullTask);
            const input = pullTask.inputData;
            const { workflowInstanceId, taskId } = pullTask;
            // Ack the task
            debug(`Ack the "${taskType}" task`);
            yield this.client.post(`${this.apiPath}/tasks/${taskId}/ack?workerid=${this.workerid}`);
            // Record running task
            const baseTaskInfo = {
                workflowInstanceId,
                taskId,
            };
            const runningTask = {
                taskId,
                task: new RunningTask_1.default(this, Object.assign(Object.assign({}, baseTaskInfo), this.runningTaskOptions)),
            };
            this.runningTasks.push(runningTask);
            debug(`Create runningTask: `, runningTask);
            // Working
            debug('Dealing with the task:', { workflowInstanceId, taskId });
            // const runningTask = this.__forceFindOneProcessingTask(taskId);
            runningTask.task.startTask();
            return fn(input, runningTask.task)
                .then(output => {
                debug('worker resolve');
                runningTask.task.stopTask();
                debug(`Resolve runningTask:`, runningTask);
                return Object.assign(Object.assign({}, baseTaskInfo), { callbackAfterSeconds: 0, outputData: output, status: _1.TaskState.completed });
            })
                .catch((err) => {
                debug('worker reject', err);
                runningTask.task.stopTask();
                debug(`Reject runningTask:`, runningTask);
                return Object.assign(Object.assign({}, baseTaskInfo), { callbackAfterSeconds: 0, reasonForIncompletion: String(err), status: _1.TaskState.failed });
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
            });
        }))();
    }
    start(taskType, fn, interval = 1000) {
        this.polling = true;
        debug(`Start polling taskType = ${taskType}, poll-interval = ${interval}, maxConcurrent = ${this.maxConcurrent}`);
        run_forever_1.forever(() => __awaiter(this, void 0, void 0, function* () {
            if (this.polling) {
                if (this.__canPollTask()) {
                    this.pollAndWork(taskType, fn)
                        .then((data) => {
                        // debug(data);
                    }, (err) => {
                        debugError(err);
                    });
                }
                yield delay_1.default(interval);
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