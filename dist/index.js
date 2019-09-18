"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var TaskTimeoutPolicyEnum;
(function (TaskTimeoutPolicyEnum) {
    TaskTimeoutPolicyEnum["retry"] = "RETRY";
    TaskTimeoutPolicyEnum["timeOutWF"] = "TIME_OUT_WF";
    TaskTimeoutPolicyEnum["alertOnly"] = "ALERT_ONLY";
})(TaskTimeoutPolicyEnum = exports.TaskTimeoutPolicyEnum || (exports.TaskTimeoutPolicyEnum = {}));
var TaskRetryLogicEnum;
(function (TaskRetryLogicEnum) {
    TaskRetryLogicEnum["fixed"] = "FIXED";
    TaskRetryLogicEnum["exponentialBackoff"] = "EXPONENTIAL_BACKOFF";
})(TaskRetryLogicEnum = exports.TaskRetryLogicEnum || (exports.TaskRetryLogicEnum = {}));
var WorkflowTaskType;
(function (WorkflowTaskType) {
    WorkflowTaskType["simple"] = "SIMPLE";
    //TODO: system task types
})(WorkflowTaskType = exports.WorkflowTaskType || (exports.WorkflowTaskType = {}));
var TaskState;
(function (TaskState) {
    TaskState["scheduled"] = "SCHEDULED";
    TaskState["inProgress"] = "IN_PROGRESS";
    TaskState["failed"] = "FAILED";
    TaskState["completed"] = "COMPLETED";
    TaskState["cancelled"] = "CANCELLED";
})(TaskState = exports.TaskState || (exports.TaskState = {}));
__export(require("./TaskMetadataManager"));
__export(require("./WorkflowMetadataManager"));
//# sourceMappingURL=index.js.map