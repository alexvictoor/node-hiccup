// Hello world HTTP
const { fork } = require('child_process');
const http = require('http');
const hiccupWorker = fork('../dist/index.js');

const client = require('../dist/client');
const recorder = new client.HiccupRecorder(hiccupWorker);

http.createServer((req, res) => {
  for (let index = 0; index < 10000; index++) {
      console.log(`${req.method} Doing crazy stuff with the event loop ${index}`);
  }
  res.end('Hello world! ' + new Date());
}).listen(8080, () => {
  console.log('Server started on port 8080');
  recorder.start();
});
