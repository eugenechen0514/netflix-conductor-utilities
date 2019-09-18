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
            name: 'test_wf' + new Date().getTime(),
            tasks: [
                {
                    "name": "task_16",
                    "taskReferenceName": "task_16_in_wf",
                    "type": WorkflowTaskType.simple,
                }
            ],
            schemaVersion: 2,
        });
        workflow/*?*/
    });
});
