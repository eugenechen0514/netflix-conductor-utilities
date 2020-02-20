
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
});

const taskType = 'test';

(async () => {
    await taskMetadataManager.registerTask({
        name: taskType,
    });

    let wfName = `test_wf_${taskType}`;
    await workflowMetadataManager.registerWorkflow({
        name: wfName,
        tasks: [
            {
                "name": taskType,
                "taskReferenceName": taskType,
                "type": WorkflowTaskType.simple,
            }
        ],
    });

    const fn = (input) => {
        return new Promise((resolve, reject) => {
            const handler = setTimeout(()=>{
                clearTimeout(handler);
                resolve({
                    result: false,
                })
            }, 3000)
        })
    };

    worker.start(taskType, fn);

    await workflowManager.startWorkflow({
        name: wfName,
    });

    await delay(10000);
    worker.stop();
})()
    .then(console.log);
