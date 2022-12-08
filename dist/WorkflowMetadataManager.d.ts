import { AxiosInstance } from 'axios';
import { ConductorSDKOptions, WorkflowDefinition, WorkflowMetadataDefinition } from "./index";
declare class WorkflowMetadataManager {
    options: ConductorSDKOptions;
    client: AxiosInstance;
    constructor(options?: ConductorSDKOptions);
    getAllWorkflows(): Promise<WorkflowDefinition[]>;
    getWorkflow(name: string, version?: number): Promise<WorkflowDefinition>;
    registerWorkflow(workflow: WorkflowMetadataDefinition): Promise<WorkflowDefinition>;
    registerOrUpdateWorkflow(workflow: WorkflowMetadataDefinition): Promise<WorkflowDefinition>;
}
export default WorkflowMetadataManager;
export { WorkflowMetadataManager };
