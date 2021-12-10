const config = require('./config');
const {ConductorWorker} = require('../build');
const fakeTaskProcessingTime = 60000;

function delay(ms = 10000) {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            resolve();
        }, ms);
    });
}

const worker = new ConductorWorker({
    url: config.url, // host
    // apiPath: config.apiPath, // base path
    workerid: 'node-worker',
    maxConcurrent: 2,
    heartbeatInterval: 1000,
    // runningTaskOptions: {
    //     keepAliveTimer: {
    //         enable: true,
    //     }
    // }
});
const taskType = config.taskType;

(async () => {
    console.log('Work polling');
    /**
     *
     * @type {WorkFunction}
     */
    const taskWorkerFn = async (input, task) => {
        console.log(`deal with the task: ${JSON.stringify(task.options)}`);

        await task.sendLog('before 1');
        await task.sendLog('before 2');

        await delay(fakeTaskProcessingTime);

        await task.sendLog('after 1');
        await task.sendLog('after 2');
        console.log('Finish to deal with the task');
    }
    worker.start(taskType, taskWorkerFn, 2000);

    console.log('Start workflow');
})()
    .then(console.log);
