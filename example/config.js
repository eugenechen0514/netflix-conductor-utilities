const url = 'http://localhost:8080';
const apiPath = '/api';
const apiEndpoint = url + apiPath;

const taskType = 'test';
const wfName = `test_wf_${this.taskType}`;

const config = {
    taskType,
    wfName,
    url,
    apiPath,
    apiEndpoint,
};

module.exports = config;
