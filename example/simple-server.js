// Hello world HTTP
const http = require('http');

require('./lib');

http.createServer((req, res) => {
  let buffer = "";
  const delay = Math.ceil(Math.random() * 100);
  const begin = Date.now();
  while (Date.now() - begin < delay) {  // blocking the event loop...
    buffer += delay;
  }
  res.end('Hello world! ' + new Date() + ' ' + buffer.length);
}).listen(8080, () => {
  console.log('Server started on port 8080');
});
