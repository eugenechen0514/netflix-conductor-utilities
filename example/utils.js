const config = require('./config');
const {ConductorWorker, TaskMetadataManager, WorkflowMetadataManager, WorkflowTaskType} = require('../build');

const taskType = config.taskType;
const wfName = config.wfName;


async function registerMetaData() {
    const taskMetadataManager = new TaskMetadataManager({apiEndpoint: config.apiEndpoint});
    const workflowMetadataManager = new WorkflowMetadataManager({apiEndpoint: config.apiEndpoint});

    await taskMetadataManager.registerTask({
        name: taskType,
        // timeoutSeconds: 2,
        // responseTimeoutSeconds: 1,
    });
    await workflowMetadataManager.registerOrUpdateWorkflow({
        name: wfName,
        tasks: [
            {
                "name": taskType,
                "taskReferenceName": taskType,
                "type": WorkflowTaskType.simple,
            }
        ],
    });
}

module.exports = {
    registerMetaData,
};
