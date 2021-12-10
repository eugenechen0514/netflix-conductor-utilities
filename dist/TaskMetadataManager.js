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
exports.TaskMetadataManager = void 0;
const assert_1 = __importDefault(require("assert"));
const axios_1 = __importDefault(require("axios"));
class TaskMetadataManager {
    constructor(options = {}) {
        this.options = options;
        const { apiEndpoint } = this.options;
        assert_1.default(apiEndpoint, 'apiEndpoint is empty');
        this.client = axios_1.default.create({
            baseURL: apiEndpoint,
            responseType: 'json',
        });
    }
    getAllTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.client.get('/metadata/taskdefs');
            return data;
        });
    }
    getTask(taskType) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.client.get(`/metadata/taskdefs/${taskType}`);
            return data;
        });
    }
    registerTask(task) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.post(`/metadata/taskdefs`, [task]);
            const taskObject = yield this.getTask(task.name);
            assert_1.default(taskObject.name === task.name, 'Create a task, but can not find task');
            return taskObject;
        });
    }
    registerTasks(tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.post(`/metadata/taskdefs`, tasks);
        });
    }
    deleteTask(taskType) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.client.delete(`/metadata/taskdefs/${taskType}`);
            return data;
        });
    }
    updateTask(task) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.put(`/metadata/taskdefs`, task);
            return this.getTask(task.name);
        });
    }
    isExist(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.getTask(name);
                return true;
            }
            catch (e) {
                // Task metadata is not exist
                console.log(e);
                return false;
            }
        });
    }
    registerOrUpdateTask(task) {
        return __awaiter(this, void 0, void 0, function* () {
            const isExist = yield this.isExist(task.name);
            if (isExist) {
                yield this.updateTask(task);
            }
            else {
                yield this.registerTask(task);
            }
            return this.getTask(task.name);
        });
    }
}
exports.TaskMetadataManager = TaskMetadataManager;
exports.default = TaskMetadataManager;
//# sourceMappingURL=TaskMetadataManager.js.map