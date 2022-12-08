import { delay, DEMO_WORKER_ID } from './utils';
import config from './config';
import { ConductorWorker } from '../src';

const fakeTaskProcessingTime = 60000;

type MyTaskInput = void;
type MyTaskOutput = void;
const worker = new ConductorWorker<MyTaskInput, MyTaskOutput>({
  url: config.url, // host
  // apiPath: config.apiPath, // base path
  workerid: DEMO_WORKER_ID,
  maxConcurrent: 2,
  // runningTaskOptions: {
  //     keepAliveTimer: {
  //         enable: true,
  //     }
  // }
});
const taskType = config.taskType;

(async () => {
  console.log('Work polling');

  worker.start(
    taskType,
    async (input, task) => {
      console.log(`deal with the task: ${JSON.stringify(task.options)}`);

      await task.sendLog('before 1');
      await task.sendLog('before 2');

      await delay(fakeTaskProcessingTime);

      await task.sendLog('after 1');
      await task.sendLog('after 2');
      console.log('Finish to deal with the task');
    },
    2000,
  );

  console.log('Start workflow');
})().then(console.log);
