const {registerMetaData} = require('./utils');

(async () => {
    await registerMetaData();
    console.log('register meta done');
})()
    .then(console.log)
    .catch(console.error)
