
export enum TaskTimeoutPolicy {
    retry = 'RETRY',
    timeOutWF = 'TIME_OUT_WF',
    alertOnly = 'ALERT_ONLY',
}

export enum TaskRetryLogic {
    fixed = 'FIXED',
    exponentialBackoff = 'EXPONENTIAL_BACKOFF',
}

/**
 * See: https://netflix.github.io/conductor/configuration/taskdef/
 */
export interface TaskMetadataDefinition {

    /**
     * Task Type. Unique name of the Task that resonates with it's function.
     *
     * Unique
     */
    name: string,

    /**
     * Description of the task
     */
    description?: string,

    /**
     * No. of retries to attempt when a Task is marked as failure
     *
     * defaults to 3
     */
    retryCount?: number,

    /**
     * Mechanism for the retries
     */
    retryLogic?: TaskRetryLogic,

    /**
     * Time to wait before retries
     *
     * defaults to 60 seconds
     */
    retryDelaySeconds?: number,

    /**
     * Task's timeout policy
     */
    timeoutPolicy?: TaskTimeoutPolicy,

    /**
     * Time in seconds, after which the task is marked as TIMED_OUT if not completed after transitioning to IN_PROGRESS
     * status for the first time
     *
     * No timeouts if set to 0
     */
    timeoutSeconds?: number,

    /**
     * Must be greater than 0 and less than timeoutSeconds. The task is rescheduled if not updated with a status after
     * this time (heartbeat mechanism). Useful when the worker polls for the task but fails to complete due to
     * errors/network failure.
     *
     * defaults to 3600
     */
    responseTimeoutSeconds?: number,

    /**
     * Array of keys of task's expected input. Used for documenting task's input.
     * See [Using inputKeys and outputKeys](https://netflix.github.io/conductor/configuration/taskdef/#using-inputkeys-and-outputkeys).
     *
     */
    inputKeys?: string[],

    /**
     * Array of keys of task's expected output. Used for documenting task's output
     */
    outputKeys?: string[],

    /**
     * See [Using inputTemplate below](https://netflix.github.io/conductor/configuration/taskdef/#using-inputtemplate).
     */
    inputTemplate?: any,

    /**
     * Number of tasks that can be executed at any given time.
     */
    concurrentExecLimit?: number,

    /**
     * See [Task Rate limits below](https://netflix.github.io/conductor/configuration/taskdef/#task-rate-limits).
     */
    rateLimitPerFrequency?: number,

    /**
     * See [Task Rate limits below](https://netflix.github.io/conductor/configuration/taskdef/#task-rate-limits).
     */
    rateLimitFrequencyInSeconds?: number
}

export interface TaskDefinition extends TaskMetadataDefinition {
    createTime?: number,
}

/**
 * See: https://netflix.github.io/conductor/configuration/workflowdef/#workflow-definition
 */
export interface WorkflowMetadataDefinition {

    /**
     * Name of the workflow
     */
    name: string,

    /**
     * Description of the workflow
     */
    description?: string,

    /**
     * Numeric field used to identify the version of the schema. Use incrementing numbers
     *
     * When starting a workflow execution, if not specified, the definition with highest version is used
     */
    version?: number,

    /**
     * An array of task definitions as described below.
     */
    tasks: (WorkflowTaskMetadata | SubWorkflowTaskMetadata)[],

    /**
     * List of input parameters. Used for documenting the required inputs to workflow
     */
    inputParameters?: object,

    /**
     * JSON template used to generate the output of the workflow
     *
     * If not specified, the output is defined as the output of the last executed task
     */
    outputParameters?: object,

    /**
     * String; Workflow to be run on current Workflow failure. Useful for cleanup or post actions on failure.
     */
    failureWorkflow?: string,

    /**
     * Current Conductor Schema version. schemaVersion 1 is discontinued.
     *
     * Must be 2
     */
    schemaVersion?: number,

    /**
     * Boolean flag to allow Workflow restarts
     * defaults to true
     */
    restartable?: boolean, //defaults to true

    /**
     * If true, every workflow that gets terminated or completed will send a notification.
     * See [below](https://netflix.github.io/conductor/configuration/workflowdef/#workflow-notifications)
     *
     * optional (false by default)
     */
    workflowStatusListenerEnabled?: boolean, //optional (false by default)
}

export interface WorkflowDefinition extends WorkflowMetadataDefinition {
    createTime?: number,
}

export enum WorkflowTaskType {
    simple= 'SIMPLE',
    subWorkflow = 'SUB_WORKFLOW',
    decision= 'DECISION',
    event = 'EVENT',
    http = 'HTTP',
    forkJoin = 'FORK_JOIN',
    forkJoinDynamic = 'FORK_JOIN_DYNAMIC',
    join = 'JOIN',
    exclusiveJoin = 'EXCLUSIVE_JOIN',
    wait = 'WAIT',
    dynamic = 'DYNAMIC',
    lambda = 'LAMBDA',
    terminate = 'TERMINATE',
    kafkaPublish = 'KAFKA_PUBLISH',
    doWhile = 'DO_WHILE',
}

export interface WorkflowTaskMetadata {
    /**
     * Name of the task. MUST be registered as a task with Conductor before starting the workflow
     */
    name: string,

    /**
     * Alias used to refer the task within the workflow. MUST be unique within workflow.
     */
    taskReferenceName: string,

    /**
     * Type of task. SIMPLE for tasks executed by remote workers, or one of the system task types
     */
    type: WorkflowTaskType,

    /**
     * Description of the task
     */
    description?: string,

    /**
     * true or false. When set to true - workflow continues even if the task fails. The status of the task is reflected
     * as COMPLETED_WITH_ERRORS
     *
     * Defaults to false
     */
    optional?: boolean,

    /**
     * JSON template that defines the input given to the task
     *
     * See [Wiring Inputs and Outputs for details](https://netflix.github.io/conductor/configuration/workflowdef/#wiring-inputs-and-outputs)
     */
    inputParameters?: object,

    /**
     * See [Task Domains for more information](https://netflix.github.io/conductor/configuration/taskdomains/).
     */
    domain?: object,
}

/**
 * See [Sub Workflow](https://netflix.github.io/conductor/configuration/systask/#sub-workflow)
 */
export interface SubWorkflowTaskMetadata extends WorkflowTaskMetadata {
    subWorkflowParam: {
        name: string,
        version: number,
        taskToDomain?: object,
    }
}

export interface WorkflowTask extends WorkflowTaskMetadata {
    startDelay: number,
    taskDefinition: TaskDefinition,
    asyncComplete: boolean,
}

export enum WorkflowStatus {
    running = 'RUNNING',
    completed = 'COMPLETED',
    failed = 'FAILED',
    timedOut = 'TIMED_OUT',
    terminated = 'TERMINATED',
    paused = 'PAUSED',
}
export interface Workflow {
    createTime: number,
    endTime: number,
    priority: number,
    schemaVersion: number,
    startTime: number,
    status: WorkflowStatus,
    updateTime: number,
    version: number,
    workflowDefinition: WorkflowDefinition,
    workflowId: string,
    workflowName: string,
    workflowType: string,
    workflowVersion: number,
    tasks: Task[],
    input?: object,
    output?: object,
}

export interface Task {
    callbackAfterSeconds: number,
    callbackFromWorker: boolean,
    endTime: number,
    executed: boolean,
    pollCount: number,
    queueWaitTime: number,
    rateLimitFrequencyInSeconds: number,
    rateLimitPerFrequency: number,
    referenceTaskName: string,
    responseTimeoutSeconds: number,
    retried: boolean,
    retryCount: number,
    scheduledTime: number,
    seq: number,
    startDelayInSeconds: number,
    startTime: number,
    status: TaskState,
    taskDefinition: TaskDefinition,
    taskDefName: string,
    taskId: string,
    taskStatus: TaskState,
    taskType: string,
    updateTime: 0,
    workflowInstanceId: string,
    workflowPriority: number,
    workflowTask: WorkflowTask,
    workflowType: number
}

export interface PollTask {
    taskType: string;
    status: TaskState;
    inputData?: any;
    referenceTaskName: string;
    retryCount: number,
    seq: number,
    correlationId: string,
    pollCount: number,
    taskDefName: string,
    scheduledTime: number,
    startTime: number,
    endTime: number,
    updateTime: number,
    startDelayInSeconds: number,
    retried: boolean,
    executed: boolean,
    callbackFromWorker: boolean,
    responseTimeoutSeconds: number,
    workflowInstanceId: string,
    workflowType: string,
    taskId: string,
    callbackAfterSeconds: number,
    workerId: string,
    workflowTask: WorkflowTask,
    rateLimitPerFrequency: number,
    rateLimitFrequencyInSeconds: number,
    workflowPriority: number,
    taskDefinition: TaskDefinition,
    queueWaitTime: number,
    taskStatus: TaskState,
}

export enum TaskState {
    scheduled= 'SCHEDULED',
    inProgress = 'IN_PROGRESS',
    failed = 'FAILED',
    completed = 'COMPLETED',
    cancelled = 'CANCELLED',
    timedOut = 'TIMED_OUT',
    skipped = 'SKIPPED',
}

export interface UpdatingTaskResult {
    workflowInstanceId: string;
    taskId: string;
    reasonForIncompletion?: string;
    callbackAfterSeconds?: number,
    status?: TaskState.inProgress | TaskState.completed | TaskState.failed,
    outputData?: any;
}

export interface  ConductorSDKOptions {
    apiEndpoint?: string;
}

/**
 * See https://netflix.github.io/conductor/apispec/#start-workflow-request
 */
export interface StartWorkflowOptions {
    /**
     * Name of the workflow
     */
    name: string,

    /**
     * Version
     */
    version?: number,

    /**
     *  correlation Id
     */
    correlationId?: string,

    /**
     * Priority
     */
    priority?: number,

    input?: object,
    taskToDomain?: object,
}

export * from './TaskMetadataManager';
export * from './WorkflowMetadataManager';
export * from './WorkflowManager';
export * from './ConductorWorker';
