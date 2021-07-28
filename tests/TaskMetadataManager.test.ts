import chai from 'chai';
const expect = chai.expect;

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
            ownerEmail: 'yujiechen0514@gmail.com',
            name: 'test_task2',
        });
        task/*?*/
        await sdk.deleteTask(task.name);
    });

    it('Update a task definition', async () => {
        const taskName = 'test_task3';

        try {
            const taskMeta = {
                ownerEmail: 'yujiechen0514@gmail.com',
                name: taskName,
                inputKeys: ['a']
            };
            await sdk.registerTask(taskMeta);
            let task = await sdk.getTask(taskName);
            expect(task.inputKeys).be.not.empty;
            if(task.inputKeys) {
                expect(task.inputKeys.length).be.eq(1);
            }


            // update
            taskMeta.inputKeys.push('b');
            await sdk.updateTask(taskMeta);

            task = await sdk.getTask(taskName);
            expect(task.inputKeys).be.not.empty;
            if(task.inputKeys) {
                expect(task.inputKeys.length).be.eq(2);
            }
        } catch (e) {

        } finally {
            await sdk.deleteTask(taskName);
        }
    });
});
