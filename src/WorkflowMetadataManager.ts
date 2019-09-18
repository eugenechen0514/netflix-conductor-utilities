import assert from 'assert';
import axios, {AxiosInstance} from 'axios';
import {ConductorSDKOptions, WorkflowDefinition, WorkflowMetadataDefinition} from "./index";

class WorkflowMetadataManager {
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

    async getAllWorkflows() {
        const {data} = await this.client.get<WorkflowDefinition[]>('/metadata/workflow');
        return data;
    }

    async getWorkflow(name: string, version?: number) {
        let suffix = (version !== undefined) ? `?version=${version}` : '';
        const {data} = await this.client.get<WorkflowDefinition>(`/metadata/workflow/${name}${suffix}`);
        return data;
    }

    async registerWorkflow(workflow: WorkflowMetadataDefinition) {
        await this.client.post<WorkflowDefinition>(`/metadata/workflow`, workflow);
        const workflowObject = await this.getWorkflow(workflow.name);
        assert(workflowObject.name === workflow.name, 'Create a workflow, but can not find workflow');
        return workflowObject;
    }
}

export default WorkflowMetadataManager;
export {WorkflowMetadataManager};
