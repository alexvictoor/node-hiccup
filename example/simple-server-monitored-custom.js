// Hello world HTTP
const { fork } = require('child_process');
const http = require('http');
const hiccupWorker = fork('../dist/start-worker.js');

const monitor = require('../dist').default;

let hiccupClient;

http.createServer((req, res) => {
  console.log('Last statistics', hiccupClient.getLastHiccupStatistics())
  let buffer = "";
  const loops = Math.ceil(Math.random() * 10000000);
  for (let index = 0; index < loops ; index++) {
      buffer += `${req.method} Doing crazy stuff with the event loop ${index}`;
  }
  res.end('Hello world! ' + new Date() + ' ' + buffer.length);
}).listen(8080, () => {
  console.log('Server started on port 8080');
  hiccupClient = monitor({
    enableIdleController: true,
    reportingIntervalMs: 5000,
    tag: 'MAIN_EVENT_LOOP',
    idleTag: 'SYSTEM_IDLE',
  });
});
