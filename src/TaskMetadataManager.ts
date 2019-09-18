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
}

export default TaskMetadataManager;
export {TaskMetadataManager};
