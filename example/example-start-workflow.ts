import config from './config';
import { WorkflowManager } from '../src';

const wfName = config.wfName;

const times = 1;
const workflowManager = new WorkflowManager({ apiEndpoint: config.apiEndpoint });

(async () => {
  const startWf = [];
  for (let i = 0; i < times; i++) {
    startWf.push(
      workflowManager.startWorkflow({
        name: wfName,
      }),
    );
  }
  await Promise.all(startWf);
})().then(console.log);
