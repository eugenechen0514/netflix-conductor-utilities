in progress...

# netflix-conductor-utilities

A simple lib for worker of Netflix conductor

# Install
``` bash
npm install netflix-conductor-utilities
```

# Usage

Sample code written by *TypeScript* and they are in some async function.

1. Metadata Manager
    1. [TaskMetadataManager](#TaskMetadataManager)
    2. [WorkflowMetadataManager](#WorkflowMetadataManager)
2. Utils
    1. [WorkflowManager](#WorkflowManager)
    2. [ConductorWorker](#ConductorWorker)
     

## Metadata Manager


### TaskMetadataManager

``` typescript
import {TaskMetadataManager} from 'netflix-conductor-utilities';

const taskMetaManager = new TaskMetadataManager({apiEndpoint: 'http://localhost:8080/api/'});

await taskMetaManager.registerTasks([{
    name: 'a_task_id',
}]);
```

### WorkflowMetadataManager

``` typescript
import {WorkflowTaskType, WorkflowMetadataManager} from 'netflix-conductor-utilities';

const workflowMetaManager = new WorkflowMetadataManager({apiEndpoint: 'http://localhost:8080/api/'});
const workflow = await workflowMetaManager.registerWorkflow({
    name: 'test_wf',
    tasks: [
        {
            "name": "a_task_id",
            "taskReferenceName": "a_task_id_in_wf",
            "type": WorkflowTaskType.simple,
        }
    ],
});
```

## Utils


### WorkflowManager

``` typescript
import {WorkflowManager} from 'netflix-conductor-utilities';

const workflowManager = new WorkflowManager({apiEndpoint: 'http://localhost:8080/api/'});
const workflow = await workflowManager.startWorkflow({
    name: 'test_wf',
});
```

### ConductorWorker
ConductorWorker Usage

``` typescript
import {ConductorWorker} from 'netflix-conductor-utilities';

// 'a_task_id' worker
const worker = new ConductorWorker<{message: string}>({
    url: 'http://localhost:8080',
    workerid: 'my_worker_host',
});

// start
worker.start('a_task_id', async (input: {data: string}, task) => {
    // send log
    await task.sendLog('hi');
    return {message: input.data};
}, 5000);

// stop
setTimeout(() => {
    worker.stop();
}, 20000)
```

