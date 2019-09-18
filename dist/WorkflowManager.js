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
}
exports.WorkflowManager = WorkflowManager;
exports.default = WorkflowManager;
//# sourceMappingURL=WorkflowManager.js.map