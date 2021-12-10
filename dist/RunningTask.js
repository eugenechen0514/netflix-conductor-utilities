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
const types_1 = require("./types");
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('RunningTask[DEBUG]');
const debugError = debug_1.default('RunningTask[Error]');
class RunningTask {
    constructor(worker, options) {
        this.worker = worker;
        // keepAliveTimer options
        const { enable = false, interval = 10000, callbackAfterSeconds = 60 } = (options === null || options === void 0 ? void 0 : options.keepAliveTimer) || {};
        this.options = Object.assign(Object.assign({}, options), { keepAliveTimer: { enable, interval, callbackAfterSeconds } });
        this.done = false;
    }
    updateTaskInfo(partialUpdateTaskInfo) {
        const updateTaskInfo = Object.assign(Object.assign({}, this.options), partialUpdateTaskInfo);
        const { client, apiPath } = this.worker;
        return client.post(`${apiPath}/tasks/`, updateTaskInfo);
    }
    __setKeepTaskTimerForNotifyConductor() {
        // clean old timer
        this.__clearKeepTaskTimerForNotifyConductor();
        // new a timer
        // notify conductor: task is still running, and not put the queue back
        debug(`start a keeping-task timer: ${this.options.keepAliveTimer.interval}`);
        this.keepRunningTimer = setInterval(() => {
            const callbackAfterSeconds = this.options.keepAliveTimer.callbackAfterSeconds;
            debug(`notify keep-task: callbackAfterSeconds: ${callbackAfterSeconds}`);
            this.updateTaskInfo({
                status: types_1.TaskState.inProgress,
                callbackAfterSeconds,
            })
                .catch(error => {
                debugError(error);
            });
        }, this.options.keepAliveTimer.interval);
    }
    __clearKeepTaskTimerForNotifyConductor() {
        debug('clear a keeping-task timer');
        if (this.keepRunningTimer) {
            clearInterval(this.keepRunningTimer);
            this.keepRunningTimer = undefined;
        }
    }
    startTask() {
        debug('start a task');
        this.start = Date.now();
        this.done = false;
        this.options.keepAliveTimer.enable && this.__setKeepTaskTimerForNotifyConductor();
    }
    sendLog(msg, others = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const otherInfo = Object.assign({ status: types_1.TaskState.inProgress }, others);
            if (this.options.keepAliveTimer.enable) {
                otherInfo.callbackAfterSeconds = this.options.keepAliveTimer.callbackAfterSeconds;
            }
            return this.updateTaskInfo(Object.assign({ logs: [
                    { log: msg, createdTime: Date.now() },
                ] }, otherInfo));
        });
    }
    stopTask() {
        debug('stop a task');
        this.options.keepAliveTimer.enable && this.__clearKeepTaskTimerForNotifyConductor();
        this.done = true;
    }
}
exports.default = RunningTask;
//# sourceMappingURL=RunningTask.js.map