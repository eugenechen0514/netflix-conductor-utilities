import WorkflowManager from "../src/WorkflowManager";

describe('WorkflowManager', () => {
    let sdk: WorkflowManager;
    before(() => {
        sdk = new WorkflowManager({apiEndpoint: 'http://localhost:8080/api/'});
    });

    it('Start workflow request', async () => {
        let workflow = await sdk.startWorkflow({
            name: 'kitchensink',
        });

        workflow = await sdk.terminateWorkflow(workflow.workflowId);

        await sdk.removeWorkflow(workflow.workflowId);
    });
});
