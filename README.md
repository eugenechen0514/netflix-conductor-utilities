# netflix-conductor-utilities
in progress...

a simple lib for worker of Netflix conductor

# Install
``` bash
npm install netflix-conductor-utilities
```

# `ConductorWorker` Usage

``` typescript
# TypeScript 3.7.2
import {ConductorWorker} from 'netflix-conductor-utilities';

// 'a_task_id' worker
const worker = new ConductorWorker<string>({
    url: 'http://localhost:8080',
    workerid: 'my_worker_host',
});

// start
worker.start('a_task_id', (input: {message: string}) => {
    return input.message;
}, 5000);

// stop
setTimeout(() => {
    worker.stop();
}, 20000)
```
