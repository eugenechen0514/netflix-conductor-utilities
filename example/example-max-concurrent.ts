import config from './config';
import { delay, DEMO_OWNER_EMAIL, DEMO_WORKER_ID } from './utils';
import {
  ConductorWorker,
  TaskMetadataManager,
  WorkflowMetadataManager,
  WorkflowTaskType,
  WorkflowManager,
} from '../src';

/****************************
 * Test for maxConcurrent
 ****************************/

const apiEndpoint = config.url + '/api/';
const taskMetadataManager = new TaskMetadataManager({ apiEndpoint });
const workflowMetadataManager = new WorkflowMetadataManager({ apiEndpoint });
const workflowManager = new WorkflowManager({ apiEndpoint });

const worker = new ConductorWorker({
  url: config.url, // host
  apiPath: '/api', // base path
  workerid: DEMO_WORKER_ID,
  maxConcurrent: 2,
});

const taskType = config.taskType;
const wfName = config.wfName;

(async () => {
  await taskMetadataManager.registerTask({
    name: taskType,
    ownerEmail: DEMO_OWNER_EMAIL,
  });
  await workflowMetadataManager.registerOrUpdateWorkflow({
    name: wfName,
    tasks: [
      {
        name: taskType,
        taskReferenceName: taskType,
        type: WorkflowTaskType.simple,
      },
    ],
    ownerEmail: DEMO_OWNER_EMAIL,
  });

  console.log('Work polling');
  worker.start(taskType, (input) => {
    console.log('deal with the task');
    return new Promise((resolve, reject) => {
      const handler = setTimeout(() => {
        clearTimeout(handler);
        resolve();
      }, 7000);
    });
  });

  console.log('Start 1th workflow');
  await workflowManager.startWorkflow({
    name: wfName,
  });

  console.log('Start 2th workflow');
  await workflowManager.startWorkflow({
    name: wfName,
  });

  console.log('Start 3th workflow');
  await workflowManager.startWorkflow({
    name: wfName,
  });

  await delay(15000);
  console.log('Stop worker');
  worker.stop();
})().then(console.log);
