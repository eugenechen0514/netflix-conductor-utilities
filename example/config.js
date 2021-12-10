const url = process.env.URL || 'http://localhost:8080';
const apiPath = '/api/';
const apiEndpoint = url + apiPath;

const taskType = 'lib_test';
const wfName = `test_wf_${taskType}`;

const config = {
    taskType,
    wfName,
    url,
    apiPath,
    apiEndpoint,
};

module.exports = config;
