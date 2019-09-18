import TaskMetadataManager from "../src/TaskMetadataManager";

describe('TaskMetadata', () => {
    let sdk: TaskMetadataManager;
    before(() => {
        sdk = new TaskMetadataManager({apiEndpoint: 'http://localhost:8080/api/'});
    });

    it('Get all task definitions', async () => {
        const tasks = await sdk.getAllTasks();
        tasks[0]
    });

    it('Retrieve task definition', async () => {
        const tasks = await sdk.getTask('task_16');
        tasks
    });

    it('Delete a task definition', async () => {
        const task = await sdk.registerTask({
            name: 'test_task2',
        });
        task/*?*/
        await sdk.deleteTask(task.name);
    });
});
