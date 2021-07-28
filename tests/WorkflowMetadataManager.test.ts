import chai from 'chai';
const expect = chai.expect;

import WorkflowMetadataManager from "../src/WorkflowMetadataManager";
import {WorkflowTaskType} from "../src";

describe('WorkflowMetadata', () => {
    let sdk: WorkflowMetadataManager;
    before(() => {
        sdk = new WorkflowMetadataManager({apiEndpoint: 'http://localhost:8080/api/'});
    });

    it('Get all workflow  definitions', async () => {
        const workflows = await sdk.getAllWorkflows();
        workflows[0]
    });

    it('Retrieve workflow definition', async () => {
        const tasks = await sdk.getWorkflow('kitchensink');
        tasks
    });

    it('Register new workflow', async () => {
        const workflow = await sdk.registerWorkflow({
            ownerEmail: 'yujiechen0514@gmail.com',
            name: 'test_wf' + new Date().getTime(),
            tasks: [
                {
                    "name": "task_16",
                    "taskReferenceName": "task_16_in_wf",
                    "type": WorkflowTaskType.simple,
                }
            ],
        });
        workflow/*?*/
    });
    it('Update workflow', async () => {
        const workflowName = 'test_workflow';
        const workflowMetadata = {
            ownerEmail: 'yujiechen0514@gmail.com',
            name: workflowName,
            tasks: [
                {
                    name: 'task_16',
                    taskReferenceName: 'task_16_in_wf',
                    type: WorkflowTaskType.simple,
                }
            ],
        };

        try {
            let workflow = await sdk.registerOrUpdateWorkflow(workflowMetadata);
            workflowMetadata.tasks[0].name = 'task_17';
            workflow = await sdk.registerOrUpdateWorkflow(workflowMetadata);
            expect(workflow.tasks[0].name).be.eq("task_17");
        } catch (e) {
            e/*?*/

            throw e;
        }
    });
});
