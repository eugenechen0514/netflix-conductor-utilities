import config from './config';
import { ConductorWorker, ConductorWorkerChainContext, WorkFunction } from '../src';
import { delay, DEMO_WORKER_ID } from './utils';

const fakeTaskProcessingTime = 1000;

// helpers

async function getUser(id: string): Promise<{ name: string }> {
  return {
    name: 'test-user-' + id,
  };
}

// create a worker
type MyTaskInput = {
  userId: string;
};
type MyTaskOutput = void;
interface MyWorkContext extends ConductorWorkerChainContext<MyTaskOutput, MyTaskInput> {
  user: {
    name: string;
  };
}

const worker = new ConductorWorker<MyTaskOutput, MyTaskInput, MyWorkContext>({
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

// add middleware - promise version
worker.use(async (ctx) => {
  ctx.user = await getUser(ctx.input.userId);
});

// add middleware - callback version
worker.use((ctx, next) => {
  getUser(ctx.input.userId)
    .then((user) => {
      ctx.user = user;
      next();
    })
    .catch((err) => {
      next(err);
    });
});

// polling
const taskType = config.taskType;
(async () => {
  console.log('Work polling');

  const taskWorkerFn: WorkFunction<MyTaskOutput, MyTaskInput, MyWorkContext> = async (input, task, ctx) => {
    console.log(`user: ${JSON.stringify(ctx.user)}`);
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
