import WorkflowManager from "../src/WorkflowManager";

describe('WorkflowManager', () => {
    let sdk: WorkflowManager;
    before(() => {
        sdk = new WorkflowManager({apiEndpoint: 'http://localhost:8080/api/'});
    });

    it('Start workflow request', async () => {
        const workflow = await sdk.startWorkflow({
            name: 'kitchensink',
        });
        workflow/*?*/
    });
});
