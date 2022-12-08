import config from './config';
import { ConductorWorker, ConductorWorkerChainContext, WorkFunction } from '../src';
import { delay, DEMO_WORKER_ID } from './utils';

const fakeTaskProcessingTime = 1000;

// helpers

async function getUser(): Promise<{ name: string }> {
  return {
    name: 'test-use',
  };
}

// create a worker
type MyTaskInput = void;
type MyTaskOutput = void;
interface MyWorkContext extends ConductorWorkerChainContext<MyTaskInput, MyTaskOutput> {
  user: {
    name: string;
  };
}

const worker = new ConductorWorker<MyTaskInput, MyTaskOutput, MyWorkContext>({
  url: config.url, // host
  // apiPath: config.apiPath, // base path
  workerid: DEMO_WORKER_ID,
  maxConcurrent: 1,
  runningTaskOptions: {
    keepAliveTimer: {
      enable: true,
      interval: 2000,
      callbackAfterSeconds: 10,
    },
  },
});

// add middleware
worker.use(async function (ctx, next) {
  ctx.user = await getUser();
});

// polling
const taskType = config.taskType;
(async () => {
  console.log('Work polling');

  const taskWorkerFn: WorkFunction<MyTaskInput, MyTaskOutput, MyWorkContext> = async (input, task, ctx) => {
    console.log(`use: ${JSON.stringify(ctx.user)}`);
    console.log(`deal with the task: ${JSON.stringify(task.options)}`);

    await task.sendLog('before 1');
    await task.sendLog('before 2');

    await delay(fakeTaskProcessingTime);

    await task.sendLog('after 1');
    await task.sendLog('after 2');
    console.log('Finish to deal with the task');
  };
  worker.start(taskType, taskWorkerFn, 2000);

  console.log('Start workflow');
})().then(console.log);
