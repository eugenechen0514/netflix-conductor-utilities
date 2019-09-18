import assert from 'assert';
import axios, {AxiosInstance} from 'axios';
import {
    ConductorSDKOptions,
    StartWorkflowOptions,
    Workflow,
    WorkflowDefinition,
    WorkflowMetadataDefinition
} from "./index";

class WorkflowManager {
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

    /**
     * Get Workflow State by workflow Id. If includeTasks is set, then also includes all the tasks executed and scheduled.
     */
    async retrieveWorkflow(workflowId: string, includeTasks = false) {
        const params = {includeTasks};
        const {data} = await this.client.get<Workflow>('/workflow/' + workflowId, {params});
        return data;
    }

    async startWorkflow(options: StartWorkflowOptions) {
        const {data: workflowId} = await this.client.post<string>('/workflow', options);
        const workflow = await this.retrieveWorkflow(workflowId);
        assert(workflow.workflowId === workflowId, 'Start a workflow, but can not find it');
        return workflow;
    }
}

export default WorkflowManager;
export {WorkflowManager};
