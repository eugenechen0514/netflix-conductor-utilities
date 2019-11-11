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
const __1 = require("../");
const debug = debug_1.default('ConductorWorker');
const debugError = debug_1.default('ConductorWorker');
class ConductorWorker extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.working = false;
        const { url = 'http://localhost:8080', apiPath = '/api', workerid = undefined } = options;
        this.url = url;
        this.apiPath = apiPath;
        this.workerid = workerid;
        this.client = axios_1.default.create({
            baseURL: this.url,
            responseType: 'json',
        });
    }
    pollAndWork(taskType, fn) {
        return (() => __awaiter(this, void 0, void 0, function* () {
            // Poll for Worker task
            const { data: pullTask } = yield this.client.get(`${this.apiPath}/tasks/poll/${taskType}?workerid=${this.workerid}`);
            if (!pullTask) {
                return;
            }
            const input = pullTask.inputData;
            const { workflowInstanceId, taskId } = pullTask;
            // Ack the Task
            const { data: obj } = yield this.client.post(`${this.apiPath}/tasks/${taskId}/ack?workerid=${this.workerid}`);
            if (obj !== true) {
                return;
            }
            const t1 = Date.now();
            const baseTaskInfo = {
                workflowInstanceId,
                taskId,
            };
            // Working
            return fn(input)
                .then(output => {
                return Object.assign(Object.assign({}, baseTaskInfo), { callbackAfterSeconds: (Date.now() - t1) / 1000, outputData: output, status: __1.TaskState.completed });
            })
                .catch((err) => {
                return Object.assign(Object.assign({}, baseTaskInfo), { callbackAfterSeconds: (Date.now() - t1) / 1000, reasonForIncompletion: String(err), status: __1.TaskState.failed });
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
            });
        }))();
    }
    start(taskType, fn, interval = 1000) {
        this.working = true;
        debug(`Start worker: taskType = ${taskType}, poll-interval = ${interval}`);
        run_forever_1.forever(() => __awaiter(this, void 0, void 0, function* () {
            if (this.working) {
                yield delay_1.default(interval);
                debug(`Poll "${taskType}" task`);
                this.pollAndWork(taskType, fn)
                    .then((data) => {
                    // debug(data);
                }, (err) => {
                    debugError(err);
                });
            }
            else {
                debug(`End worker: taskType = ${taskType}`);
                return run_forever_1.END;
            }
        }));
    }
    stop() {
        this.working = false;
    }
}
exports.ConductorWorker = ConductorWorker;
exports.default = ConductorWorker;
//# sourceMappingURL=ConductorWorker.js.map