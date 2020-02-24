const config = require('./config');
const {ConductorWorker} = require('../build');
const fakeTaskProcessingTime = 10000;

function delay(ms = 10000) {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            resolve();
        }, ms);
    });
}

const worker = new ConductorWorker({
    url: config.url, // host
    apiPath: config.apiPath, // base path
    workerid: 'node-worker',
    maxConcurrent: 2,
    heartbeatInterval: 1000,
});
const taskType = config.taskType;

(async () => {
    console.log('Work polling');
    worker.start(taskType, (input) => {
        console.log('deal with the task');
        return (async () => {
            await delay(fakeTaskProcessingTime);
            console.log('Finish to deal with the task');
        })();
    }, 5000);

    console.log('Start workflow');
})()
    .then(console.log);
