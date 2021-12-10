"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskState = exports.WorkflowStatus = exports.WorkflowTaskType = exports.TaskRetryLogic = exports.TaskTimeoutPolicy = void 0;
var TaskTimeoutPolicy;
(function (TaskTimeoutPolicy) {
    TaskTimeoutPolicy["retry"] = "RETRY";
    TaskTimeoutPolicy["timeOutWF"] = "TIME_OUT_WF";
    TaskTimeoutPolicy["alertOnly"] = "ALERT_ONLY";
})(TaskTimeoutPolicy = exports.TaskTimeoutPolicy || (exports.TaskTimeoutPolicy = {}));
var TaskRetryLogic;
(function (TaskRetryLogic) {
    TaskRetryLogic["fixed"] = "FIXED";
    TaskRetryLogic["exponentialBackoff"] = "EXPONENTIAL_BACKOFF";
})(TaskRetryLogic = exports.TaskRetryLogic || (exports.TaskRetryLogic = {}));
var WorkflowTaskType;
(function (WorkflowTaskType) {
    WorkflowTaskType["simple"] = "SIMPLE";
    WorkflowTaskType["subWorkflow"] = "SUB_WORKFLOW";
    WorkflowTaskType["decision"] = "DECISION";
    WorkflowTaskType["event"] = "EVENT";
    WorkflowTaskType["http"] = "HTTP";
    WorkflowTaskType["forkJoin"] = "FORK_JOIN";
    WorkflowTaskType["forkJoinDynamic"] = "FORK_JOIN_DYNAMIC";
    WorkflowTaskType["join"] = "JOIN";
    WorkflowTaskType["exclusiveJoin"] = "EXCLUSIVE_JOIN";
    WorkflowTaskType["wait"] = "WAIT";
    WorkflowTaskType["dynamic"] = "DYNAMIC";
    WorkflowTaskType["lambda"] = "LAMBDA";
    WorkflowTaskType["terminate"] = "TERMINATE";
    WorkflowTaskType["kafkaPublish"] = "KAFKA_PUBLISH";
    WorkflowTaskType["doWhile"] = "DO_WHILE";
})(WorkflowTaskType = exports.WorkflowTaskType || (exports.WorkflowTaskType = {}));
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["running"] = "RUNNING";
    WorkflowStatus["completed"] = "COMPLETED";
    WorkflowStatus["failed"] = "FAILED";
    WorkflowStatus["timedOut"] = "TIMED_OUT";
    WorkflowStatus["terminated"] = "TERMINATED";
    WorkflowStatus["paused"] = "PAUSED";
})(WorkflowStatus = exports.WorkflowStatus || (exports.WorkflowStatus = {}));
var TaskState;
(function (TaskState) {
    TaskState["scheduled"] = "SCHEDULED";
    TaskState["inProgress"] = "IN_PROGRESS";
    TaskState["failed"] = "FAILED";
    TaskState["completed"] = "COMPLETED";
    TaskState["cancelled"] = "CANCELLED";
    TaskState["timedOut"] = "TIMED_OUT";
    TaskState["skipped"] = "SKIPPED";
})(TaskState = exports.TaskState || (exports.TaskState = {}));
//# sourceMappingURL=types.js.map