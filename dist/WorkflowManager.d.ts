import { AxiosInstance } from 'axios';
import { ConductorSDKOptions, StartWorkflowOptions, Workflow } from "./index";
interface RerunWorkflowOptions {
    reRunFromWorkflowId: string;
    workflowInput: any;
    reRunFromTaskId: string;
    taskInput: any;
}
interface SkipWorkflowTaskOptions {
    taskReferenceName: string;
    taskInput: any;
    taskOutput: any;
}
declare class WorkflowManager {
    options: ConductorSDKOptions;
    client: AxiosInstance;
    constructor(options?: ConductorSDKOptions);
    /**
     * Get Workflow State by workflow Id. If includeTasks is set, then also includes all the tasks executed and scheduled.
     */
    retrieveWorkflow<INPUT = any, OUTPUT = any>(workflowId: string, includeTasks?: boolean): Promise<Workflow<INPUT, OUTPUT>>;
    startWorkflow(options: StartWorkflowOptions): Promise<Workflow<any, any>>;
    terminateWorkflow(workflowId: string): Promise<Workflow<any, any>>;
    removeWorkflow(workflowId: string): Promise<Workflow<any, any>>;
    /**
     * Pause. No further tasks will be scheduled until resumed. Currently running tasks are not paused.
     * @param workflowId
     */
    pauseWorkflow(workflowId: string): Promise<Workflow<any, any>>;
    /**
     * Resume normal operations after a pause.
     * @param workflowId
     */
    resumeWorkflow(workflowId: string): Promise<Workflow<any, any>>;
    /**
     * Re-runs a completed workflow from a specific task.
     * @param workflowId
     * @param options
     */
    rerunWorkflow(workflowId: string, options: RerunWorkflowOptions): Promise<Workflow<any, any>>;
    /**
     * Restart workflow execution from the start. Current execution history is wiped out.
     * @param workflowId
     */
    restartWorkflow(workflowId: string): Promise<Workflow<any, any>>;
    /**
     * Retry the last failed task.
     * @param workflowId
     */
    retryWorkflow(workflowId: string): Promise<Workflow<any, any>>;
    /**
     * Skips a task execution (specified as taskReferenceName parameter) in a running workflow and continues forward.
     * Optionally updating task's input and output as specified in the payload.
     * PUT /workflow/{workflowId}/skiptask/{taskReferenceName}?workflowId=&taskReferenceName=
     * @param workflowId
     * @param options
     */
    skipWorkflowTask(workflowId: string, options: SkipWorkflowTaskOptions): Promise<Workflow<any, any>>;
}
export default WorkflowManager;
export { WorkflowManager };
