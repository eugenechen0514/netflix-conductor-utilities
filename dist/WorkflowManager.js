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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const axios_1 = __importDefault(require("axios"));
class WorkflowManager {
    constructor(options = {}) {
        this.options = options;
        const { apiEndpoint } = this.options;
        assert_1.default(apiEndpoint, 'apiEndpoint is empty');
        this.client = axios_1.default.create({
            baseURL: apiEndpoint,
            responseType: 'json',
        });
    }
    /**
     * Get Workflow State by workflow Id. If includeTasks is set, then also includes all the tasks executed and scheduled.
     */
    retrieveWorkflow(workflowId, includeTasks = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = { includeTasks };
            const { data } = yield this.client.get('/workflow/' + workflowId, { params });
            return data;
        });
    }
    startWorkflow(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: workflowId } = yield this.client.post('/workflow', options);
            const workflow = yield this.retrieveWorkflow(workflowId);
            assert_1.default(workflow.workflowId === workflowId, 'Start a workflow, but can not find it');
            return workflow;
        });
    }
    terminateWorkflow(workflowId) {
        return __awaiter(this, void 0, void 0, function* () {
            const workflow = yield this.retrieveWorkflow(workflowId);
            yield this.client.delete('/workflow/' + workflowId);
            return workflow;
        });
    }
    removeWorkflow(workflowId) {
        return __awaiter(this, void 0, void 0, function* () {
            const workflow = yield this.retrieveWorkflow(workflowId);
            yield this.client.delete('/workflow/' + workflowId + '/remove');
            return workflow;
        });
    }
    /**
     * Pause. No further tasks will be scheduled until resumed. Currently running tasks are not paused.
     * @param workflowId
     */
    pauseWorkflow(workflowId) {
        return __awaiter(this, void 0, void 0, function* () {
            const workflow = yield this.retrieveWorkflow(workflowId);
            yield this.client.put('/workflow/' + workflowId + '/pause');
            return workflow;
        });
    }
    /**
     * Resume normal operations after a pause.
     * @param workflowId
     */
    resumeWorkflow(workflowId) {
        return __awaiter(this, void 0, void 0, function* () {
            const workflow = yield this.retrieveWorkflow(workflowId);
            yield this.client.put('/workflow/' + workflowId + '/resume');
            return workflow;
        });
    }
    /**
     * Re-runs a completed workflow from a specific task.
     * @param workflowId
     * @param options
     */
    rerunWorkflow(workflowId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.client.post('/workflow/' + workflowId + '/rerun', options);
            const workflow = yield this.retrieveWorkflow(workflowId);
            return workflow;
        });
    }
    /**
     * Restart workflow execution from the start. Current execution history is wiped out.
     * @param workflowId
     */
    restartWorkflow(workflowId) {
        return __awaiter(this, void 0, void 0, function* () {
            const workflow = yield this.retrieveWorkflow(workflowId);
            yield this.client.post('/workflow/' + workflowId + '/restart');
            return workflow;
        });
    }
    /**
     * Retry the last failed task.
     * @param workflowId
     */
    retryWorkflow(workflowId) {
        return __awaiter(this, void 0, void 0, function* () {
            const workflow = yield this.retrieveWorkflow(workflowId);
            yield this.client.post('/workflow/' + workflowId + '/retry');
            return workflow;
        });
    }
    /**
     * Skips a task execution (specified as taskReferenceName parameter) in a running workflow and continues forward.
     * Optionally updating task's input and output as specified in the payload.
     * PUT /workflow/{workflowId}/skiptask/{taskReferenceName}?workflowId=&taskReferenceName=
     * @param workflowId
     * @param options
     */
    skipWorkflowTask(workflowId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(options.taskReferenceName, 'taskReferenceName should be not empty');
            const { taskReferenceName } = options, others = __rest(options, ["taskReferenceName"]);
            const { data } = yield this.client.put('/workflow/' + workflowId + '/skiptask/' + taskReferenceName, others);
            const workflow = yield this.retrieveWorkflow(workflowId);
            return workflow;
        });
    }
}
exports.WorkflowManager = WorkflowManager;
exports.default = WorkflowManager;
//# sourceMappingURL=WorkflowManager.js.map