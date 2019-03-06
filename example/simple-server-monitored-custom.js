// Hello world HTTP
const { fork } = require('child_process');
const http = require('http');
const hiccupWorker = fork('../dist/start-worker.js');

const monitor = require('../dist').default;

let hiccupClient;

http.createServer((req, res) => {
  let buffer = "";
  const delay = Math.ceil(Math.random() * 100);
  const begin = Date.now();
  while (Date.now() - begin < delay) { // blocking the event loop...
    buffer += delay;
  }
  res.end(JSON.stringify(hiccupClient.getLastIntervalStatistics(), null, 2));
}).listen(8080, () => {
  console.log('Server started on port 8080');
  hiccupClient = monitor({
    enableIdleController: true,
    reportingIntervalMs: 10000,
    tag: 'MAIN_EVENT_LOOP',
    idleTag: 'SYSTEM_IDLE',
  });
});
