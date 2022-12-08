import { AxiosInstance } from 'axios';
import { ConductorSDKOptions, TaskDefinition, TaskMetadataDefinition } from "./index";
declare class TaskMetadataManager {
    options: ConductorSDKOptions;
    client: AxiosInstance;
    constructor(options?: ConductorSDKOptions);
    getAllTasks(): Promise<TaskDefinition[]>;
    getTask(taskType: string): Promise<TaskDefinition>;
    registerTask(task: TaskMetadataDefinition): Promise<TaskDefinition>;
    registerTasks(tasks: TaskMetadataDefinition[]): Promise<void>;
    deleteTask(taskType: string): Promise<TaskDefinition>;
    updateTask(task: TaskMetadataDefinition): Promise<TaskDefinition>;
    isExist(name: string): Promise<boolean>;
    registerOrUpdateTask(task: TaskMetadataDefinition): Promise<TaskDefinition>;
}
export default TaskMetadataManager;
export { TaskMetadataManager };
