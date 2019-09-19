import assert from 'assert';
import axios, {AxiosInstance} from 'axios';
import {ConductorSDKOptions, TaskDefinition, TaskMetadataDefinition} from "./index";


class TaskMetadataManager {
    options: ConductorSDKOptions;
    client: AxiosInstance;

    constructor(options: ConductorSDKOptions = {}) {
        this.options = options;

        const {apiEndpoint} = this.options;
        assert(apiEndpoint, 'apiEndpoint is empty');

        this.client = axios.create({
            baseURL: apiEndpoint,
            responseType: 'json',
        });
    }

    async getAllTasks() {
        const {data} = await this.client.get<TaskDefinition[]>('/metadata/taskdefs');
        return data;
    }

    async getTask(taskType: string) {
        const {data} = await this.client.get<TaskDefinition>(`/metadata/taskdefs/${taskType}`);
        return data;
    }

    async registerTask(task: TaskMetadataDefinition) {
        await this.client.post<TaskDefinition[]>(`/metadata/taskdefs`, [task]);
        const taskObject = await this.getTask(task.name);
        assert(taskObject.name === task.name, 'Create a task, but can not find task');
        return taskObject;
    }

    async registerTasks(tasks: TaskMetadataDefinition[]) {
        await this.client.post<TaskDefinition[]>(`/metadata/taskdefs`, tasks);
    }

    async deleteTask(taskType: string) {
        const {data} = await this.client.delete<TaskDefinition>(`/metadata/taskdefs/${taskType}`);
        return data;
    }

    async updateTask(task: TaskMetadataDefinition) {
        await this.client.put<void>(`/metadata/taskdefs`, task);
        return this.getTask(task.name);
    }

    async isExist(name: string) {
        try {
            await this.getTask(name);
            return true;
        } catch (e) {
            // Task metadata is not exist
            console.log(e);
            return false;
        }
    }

    async registerOrUpdateTask(task: TaskMetadataDefinition) {
        const isExist = await this.isExist(task.name);
        if(isExist) {
            await this.updateTask(task);
        } else {
            await this.registerTask(task);
        }
        return this.getTask(task.name);
    }
}

export default TaskMetadataManager;
export {TaskMetadataManager};
