import {ConductorWorker} from '../src';

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
