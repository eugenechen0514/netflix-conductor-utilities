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
const debug_1 = __importDefault(require("debug"));
const events_1 = require("events");
const run_forever_1 = require("run-forever");
const delay_1 = __importDefault(require("delay"));
const axios_1 = __importDefault(require("axios"));
const _1 = require("./");
const debug = debug_1.default('ConductorWorker[DEBUG]');
const debugError = debug_1.default('ConductorWorker[Error]');
class ConductorWorker extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.polling = false;
        this.maxConcurrent = Number.POSITIVE_INFINITY;
        this.runningTasks = [];
        const { url = 'http://localhost:8080', apiPath = '/api', workerid = undefined, maxConcurrent } = options;
        this.url = url;
        this.apiPath = apiPath;
        this.workerid = workerid;
        if (maxConcurrent) {
            this.maxConcurrent = maxConcurrent;
        }
        this.client = axios_1.default.create({
            baseURL: this.url,
            responseType: 'json',
        });
    }
    pollAndWork(taskType, fn) {
        return (() => __awaiter(this, void 0, void 0, function* () {
            // NOTE: There is a potential problem which is 「poll task」 and 「ack task」 should be as soon as possible,
            //  if no two workers maybe deal with simultaneously when they poll the same task at the same time.
            // Poll for Worker task
            debug(`Poll a "${taskType}" task`);
            const { data: pullTask } = yield this.client.get(`${this.apiPath}/tasks/poll/${taskType}?workerid=${this.workerid}`);
            if (!pullTask) {
                return;
            }
            const input = pullTask.inputData;
            const { workflowInstanceId, taskId } = pullTask;
            // Ack the Task
            debug(`Ack the "${taskType}" task`);
            yield this.client.post(`${this.apiPath}/tasks/${taskId}/ack?workerid=${this.workerid}`);
            // Record running task
            this.runningTasks.push(taskId);
            const t1 = Date.now();
            const baseTaskInfo = {
                workflowInstanceId,
                taskId,
            };
            // Working
            debug('Dealing with the task:', { workflowInstanceId, taskId });
            return fn(input)
                .then(output => {
                debug('worker resolve');
                return Object.assign(Object.assign({}, baseTaskInfo), { callbackAfterSeconds: (Date.now() - t1) / 1000, outputData: output, status: _1.TaskState.completed });
            })
                .catch((err) => {
                debug('worker reject', err);
                return Object.assign(Object.assign({}, baseTaskInfo), { callbackAfterSeconds: (Date.now() - t1) / 1000, reasonForIncompletion: String(err), status: _1.TaskState.failed });
            })
                .then(updateTaskInfo => {
                // release running task
                this.runningTasks = this.runningTasks.filter(taskId => taskId !== updateTaskInfo.taskId);
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
            });
        }))();
    }
    start(taskType, fn, interval = 1000) {
        this.polling = true;
        debug(`Start polling taskType = ${taskType}, poll-interval = ${interval}, maxConcurrent = ${this.maxConcurrent}`);
        run_forever_1.forever(() => __awaiter(this, void 0, void 0, function* () {
            if (this.polling) {
                yield delay_1.default(interval);
                debug(`Check the amount of running tasks: ${this.runningTasks.length}`);
                if (this.runningTasks.length < this.maxConcurrent) {
                    this.pollAndWork(taskType, fn)
                        .then((data) => {
                        // debug(data);
                    }, (err) => {
                        debugError(err);
                    });
                }
                else {
                    debug(`Skip polling task because the work reaches the max amount of running tasks`);
                }
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