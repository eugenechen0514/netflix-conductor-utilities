import config from './config';
import { ConductorWorker } from '../src';
import { DEMO_WORKER_ID } from './utils';

// 'a_task_id' worker
const worker = new ConductorWorker<{ message: string }, { data: string }>({
  url: config.url,
  workerid: DEMO_WORKER_ID,
});

// start
worker.start(
  config.taskType,
  async (input, task) => {
    // send log
    await task.sendLog('hi');
    return { message: input.data };
  },
  5000,
);

// stop
setTimeout(() => {
  worker.stop();
}, 20000);
