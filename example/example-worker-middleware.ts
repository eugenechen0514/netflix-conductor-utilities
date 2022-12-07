import os from 'os';
import config from './config';
import { ConductorWorker, ConductorWorkerChainContext, WorkFunction } from '../src';

const fakeTaskProcessingTime = 5000;

// helpers
function delay(ms = 10000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, ms);
  });
}

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
  workerid: 'node-worker-' + os.hostname(),
  maxConcurrent: 1,
});

// add middleware
worker.use(async function (ctx, next) {
  ctx.user = await getUser();

  // next middleware
  next();
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
