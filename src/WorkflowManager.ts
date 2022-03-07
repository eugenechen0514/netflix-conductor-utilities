import assert from 'assert';
import axios, {AxiosInstance} from 'axios';
import {
    ConductorSDKOptions,
    StartWorkflowOptions,
    Workflow,
    WorkflowDefinition,
    WorkflowMetadataDefinition
} from "./index";

interface RerunWorkflowOptions {
    reRunFromWorkflowId: string,
    workflowInput: any,
    reRunFromTaskId: string,
    taskInput: any
}

interface SkipWorkflowTaskOptions {
    taskReferenceName: string,
    taskInput: any,
    taskOutput: any,
}

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
    async retrieveWorkflow<INPUT= any, OUTPUT = any>(workflowId: string, includeTasks = false) {
        const params = {includeTasks};
        const {data} = await this.client.get<Workflow<INPUT, OUTPUT>>('/workflow/' + workflowId, {params});
        return data;
    }

    async startWorkflow(options: StartWorkflowOptions) {
        const {data: workflowId} = await this.client.post<string>('/workflow', options);
        const workflow = await this.retrieveWorkflow(workflowId);
        assert(workflow.workflowId === workflowId, 'Start a workflow, but can not find it');
        return workflow;
    }

    async terminateWorkflow(workflowId: string) {
        const workflow = await this.retrieveWorkflow(workflowId);
        await this.client.delete<string>('/workflow/' + workflowId);
        return workflow;
    }

    async removeWorkflow(workflowId: string) {
        const workflow = await this.retrieveWorkflow(workflowId);
        await this.client.delete<string>('/workflow/' + workflowId + '/remove');
        return workflow;
    }

    /**
     * Pause. No further tasks will be scheduled until resumed. Currently running tasks are not paused.
     * @param workflowId
     */
    async pauseWorkflow(workflowId: string) {
        const workflow = await this.retrieveWorkflow(workflowId);
        await this.client.put<string>('/workflow/' + workflowId + '/pause');
        return workflow;
    }

    /**
     * Resume normal operations after a pause.
     * @param workflowId
     */
    async resumeWorkflow(workflowId: string) {
        const workflow = await this.retrieveWorkflow(workflowId);
        await this.client.put<string>('/workflow/' + workflowId + '/resume');
        return workflow;
    }

    /**
     * Re-runs a completed workflow from a specific task.
     * @param workflowId
     * @param options
     */
    async rerunWorkflow(workflowId: string, options: RerunWorkflowOptions) {
        const {data} = await this.client.post<string>('/workflow/' + workflowId + '/rerun', options);
        const workflow = await this.retrieveWorkflow(workflowId);
        return workflow;
    }

    /**
     * Restart workflow execution from the start. Current execution history is wiped out.
     * @param workflowId
     */
    async restartWorkflow(workflowId: string) {
        const workflow = await this.retrieveWorkflow(workflowId);
        await this.client.post<string>('/workflow/' + workflowId + '/restart');
        return workflow;
    }

    /**
     * Retry the last failed task.
     * @param workflowId
     */
    async retryWorkflow(workflowId: string) {
        const workflow = await this.retrieveWorkflow(workflowId);
        await this.client.post<string>('/workflow/' + workflowId + '/retry');
        return workflow;
    }

    /**
     * Skips a task execution (specified as taskReferenceName parameter) in a running workflow and continues forward.
     * Optionally updating task's input and output as specified in the payload.
     * PUT /workflow/{workflowId}/skiptask/{taskReferenceName}?workflowId=&taskReferenceName=
     * @param workflowId
     * @param options
     */
    async skipWorkflowTask(workflowId: string, options: SkipWorkflowTaskOptions) {
        assert(options.taskReferenceName, 'taskReferenceName should be not empty');
        const {taskReferenceName, ...others} = options;
        const {data} = await this.client.put<string>('/workflow/' + workflowId + '/skiptask/' + taskReferenceName, others);
        const workflow = await this.retrieveWorkflow(workflowId);
        return workflow;
    }
}

export default WorkflowManager;
export {WorkflowManager};
