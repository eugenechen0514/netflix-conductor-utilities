
const {ConductorWorker, TaskMetadataManager, WorkflowMetadataManager, WorkflowTaskType, WorkflowManager} = require('../build');

function delay(ms = 10000) {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            resolve();
        }, ms);
    });
}

const taskMetadataManager = new TaskMetadataManager({apiEndpoint: 'http://localhost:8080/api/'});
const workflowMetadataManager = new WorkflowMetadataManager({apiEndpoint: 'http://localhost:8080/api/'});
const workflowManager = new WorkflowManager({apiEndpoint: 'http://localhost:8080/api/'});

const worker = new ConductorWorker({
    url: 'http://localhost:8080', // host
    apiPath: '/api', // base path
    workerid: 'node-worker',
    maxConcurrent: 2
});

const taskType = 'test';
const wfName = `test_wf_${taskType}`;

(async () => {
    await taskMetadataManager.registerTask({
        name: taskType,
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

    console.log('Work polling');
    worker.start(taskType, (input) => {
        console.log('deal with the task');
        return new Promise((resolve, reject) => {
            const handler = setTimeout(()=>{
                clearTimeout(handler);
                resolve();
            }, 7000)
        })
    });

    console.log('Start 1th workflow');
    await workflowManager.startWorkflow({
        name: wfName,
    });

    console.log('Start 2th workflow');
    await workflowManager.startWorkflow({
        name: wfName,
    });

    console.log('Start 3th workflow');
    await workflowManager.startWorkflow({
        name: wfName,
    });

    await delay(15000);
    console.log('Stop worker');
    worker.stop();
})()
    .then(console.log);
