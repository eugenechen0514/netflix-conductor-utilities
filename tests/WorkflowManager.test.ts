import WorkflowManager from "../src/WorkflowManager";

describe('WorkflowMetadata', () => {
    let sdk: WorkflowManager;
    before(() => {
        sdk = new WorkflowManager({apiEndpoint: 'http://localhost:8080/api/'});
    });


    it('Start workflow request', async () => {
        const workflow = await sdk.startWorkflow({
            name: 'test_wf1568787016711',
        });
        workflow/*?*/
    });
});
