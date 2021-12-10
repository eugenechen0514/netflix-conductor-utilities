const config = require('./config');
const {ConductorWorker, TaskMetadataManager, WorkflowMetadataManager, WorkflowTaskType} = require('../build');

const taskType = config.taskType;
const wfName = config.wfName;


async function registerMetaData() {
    const taskMetadataManager = new TaskMetadataManager({apiEndpoint: config.apiEndpoint});
    const workflowMetadataManager = new WorkflowMetadataManager({apiEndpoint: config.apiEndpoint});

    const taskMeta = {
        ownerEmail: 'yujiechen0514@gmail.com',
        name: taskType,
        timeoutSeconds: 90,
        responseTimeoutSeconds: 10,
        // inputKeys: [],
        // outputKeys: [],
        // retryCount: 0,
    };
    await taskMetadataManager.registerTasks([taskMeta]);
    await workflowMetadataManager.registerOrUpdateWorkflow({
        ownerEmail: 'yujiechen0514@gmail.com',
        name: wfName,
        tasks: [
            {
                type: WorkflowTaskType.simple,
                name: taskType,
                taskReferenceName: taskType,
            }
        ],
    });
}

module.exports = {
    registerMetaData,
};
