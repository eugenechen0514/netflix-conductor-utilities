This is a non-official package. 

If you are looking for official packages, you can find [conductor-javascript](https://github.com/conductor-sdk/conductor-javascript) in [conductor-sdk](https://github.com/conductor-sdk) repository  


[![NPM](https://nodei.co/npm/netflix-conductor-utilities.png)](https://nodei.co/npm/netflix-conductor-utilities/)
<!--[![NPM](https://nodei.co/npm-dl/netflix-conductor-utilities.png?height=3)](https://nodei.co/npm/netflix-conductor-utilities/)-->

# IMPORTANT

Because the “POST /tasks/{taskId}/ack“ api removed in ConductorV3, workers have been no longer to acknowledge a Conductor Server. To be compatible with ConductorV2 in following packages(^0.7.0), `needAckTask` option(default `false`) in **ConductorWorker** can control whether a worker acknowledges a Conductor Server.

# netflix-conductor-utilities

A simple lib for worker of Netflix conductor

# Install

``` bash
npm install netflix-conductor-utilities
```

Note: The previous versions before 0.6.1 only work for ConductorV2.

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
            "ownerEmail": "yujiechen0514@gmail.com"
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
#### ConductorWorker Simple Usage

``` typescript
import {ConductorWorker} from 'netflix-conductor-utilities';

// 'a_task_id' worker
const worker = new ConductorWorker<{message: string}, {data: string}>({
    url: 'http://localhost:8080',
    workerid: 'my_worker_host',
   
   // maximum number of parallel running tasks
    maxConcurrent: 2,
    
    // shoule be 'true' for a ConductorV2
    needAckTask: false
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

#### ConductorWorker Usage with Middleware

This function is useful for fetching extra data into "task context" before executing a task.

``` typescript
import {ConductorWorker} from 'netflix-conductor-utilities';

// 'a_task_id' worker
const worker = new ConductorWorker<{message: string}, {data: string}>({
    url: 'http://localhost:8080',
    workerid: 'my_worker_host',
   
   // maximum number of parallel running tasks
    maxConcurrent: 2,
    
    // shoule be 'true' for a ConductorV2
    needAckTask: false
});

// add middleware - promise version
worker.use(async (ctx) => {
  ctx.user = await getUser();
});

// add middleware - callback version
worker.use((ctx, next) => {
  getUser()
    .then((user) => {
      ctx.user = user;
      next();
    })
    .catch((err) => {
      next(err);
    });
});


// start
worker.start('a_task_id', async (input: {data: string}, task, ctx) => {
    // access context
    console.log(ctx.user)

    // send log
    await task.sendLog('hi');
    return {message: input.data};
}, 5000);

```

#### Other examples
[See more example](./example)

