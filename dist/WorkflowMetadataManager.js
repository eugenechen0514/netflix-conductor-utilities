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
exports.WorkflowMetadataManager = void 0;
const assert_1 = __importDefault(require("assert"));
const axios_1 = __importDefault(require("axios"));
class WorkflowMetadataManager {
    constructor(options = {}) {
        this.options = options;
        const { apiEndpoint } = this.options;
        assert_1.default(apiEndpoint, 'apiEndpoint is empty');
        this.client = axios_1.default.create({
            baseURL: apiEndpoint,
            responseType: 'json',
        });
    }
    getAllWorkflows() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.client.get('/metadata/workflow');
            return data;
        });
    }
    getWorkflow(name, version) {
        return __awaiter(this, void 0, void 0, function* () {
            let suffix = (version !== undefined) ? `?version=${version}` : '';
            const url = `/metadata/workflow/${name}${suffix}`;
            const { data } = yield this.client.get(url);
            return data;
        });
    }
    registerWorkflow(workflow) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.post(`/metadata/workflow`, workflow);
            const workflowObject = yield this.getWorkflow(workflow.name);
            assert_1.default(workflowObject.name === workflow.name, 'Create a workflow, but can not find workflow');
            return workflowObject;
        });
    }
    registerOrUpdateWorkflow(workflow) {
        return __awaiter(this, void 0, void 0, function* () {
            const name = workflow.name;
            const version = workflow.version;
            yield this.client.put(`/metadata/workflow`, [workflow]);
            return this.getWorkflow(name, version);
        });
    }
}
exports.WorkflowMetadataManager = WorkflowMetadataManager;
exports.default = WorkflowMetadataManager;
//# sourceMappingURL=WorkflowMetadataManager.js.map