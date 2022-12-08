import os from 'os';
import config from './config';
import { TaskMetadataManager, WorkflowMetadataManager, WorkflowTaskType } from '../src';

const taskType = config.taskType;
const wfName = config.wfName;

export const DEMO_OWNER_EMAIL = 'yujiechen0514@gmail.com';
export const DEMO_WORKER_ID = 'node-worker-' + os.hostname();

export function delay(ms = 10000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, ms);
  });
}

export async function registerMetaData() {
  const taskMetadataManager = new TaskMetadataManager({ apiEndpoint: config.apiEndpoint });
  const workflowMetadataManager = new WorkflowMetadataManager({ apiEndpoint: config.apiEndpoint });

  const taskMeta = {
    ownerEmail: DEMO_OWNER_EMAIL,
    name: taskType,
    timeoutSeconds: 90,
    responseTimeoutSeconds: 10,
    // inputKeys: [],
    // outputKeys: [],
    // retryCount: 0,
  };
  await taskMetadataManager.registerTasks([taskMeta]);
  await workflowMetadataManager.registerOrUpdateWorkflow({
    ownerEmail: DEMO_OWNER_EMAIL,
    name: wfName,
    tasks: [
      {
        type: WorkflowTaskType.simple,
        name: taskType,
        taskReferenceName: taskType,
      },
    ],
  });
}
