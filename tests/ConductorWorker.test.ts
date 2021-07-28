import chai from 'chai';
const expect = chai.expect;
import WorkflowManager from "../src/WorkflowManager";
import {TaskMetadataManager, WorkflowMetadataManager, ConductorWorker, WorkflowTaskType} from "../src";

function delay(ms = 10000) {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            resolve();
        }, ms);
    });
}

describe('WorkflowManager', function () {
    this.timeout(10000);

    const taskMetadataManager = new TaskMetadataManager({apiEndpoint: 'http://localhost:8080/api/'});
    const workflowMetadataManager = new WorkflowMetadataManager({apiEndpoint: 'http://localhost:8080/api/'});
    const workflowManager = new WorkflowManager({apiEndpoint: 'http://localhost:8080/api/'});

    const taskType = 'test';
    const wfName = `test_wf_${taskType}`;

    before(async () => {
        await taskMetadataManager.registerTask({
            ownerEmail: 'yujiechen0514@gmail.com',
            name: taskType,
        });

        await workflowMetadataManager.registerOrUpdateWorkflow({
            ownerEmail: 'yujiechen0514@gmail.com',
            name: wfName,
            tasks: [
                {
                    "name": taskType,
                    "taskReferenceName": taskType,
                    "type": WorkflowTaskType.simple,
                }
            ],
        });
    });

    it('Start workflow request', async () => {
        // arrange
        const worker = new ConductorWorker({
            url: 'http://localhost:8080', // host
            apiPath: '/api', // base path
            workerid: 'node-worker',
        });
        let called = false;

        // act
        worker.start(taskType, () => {
            return new Promise((resolve, reject) => {
                const handler = setTimeout(()=>{
                    clearTimeout(handler);
                    called = true;
                    resolve();
                }, 500)
            })
        }, 1000);

        await workflowManager.startWorkflow({
            name: wfName,
        });

        // assert
        await delay(4000);
        worker.stop();

        expect(called).be.eq(true);
    });
});
