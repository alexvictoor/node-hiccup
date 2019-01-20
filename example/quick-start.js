// Hello world HTTP
const http = require('http');

const monitor = require('../dist').default;

http.createServer((req, res) => {
  let buffer = "";
  const loops = Math.ceil(Math.random() * 1000000);
  for (let index = 0; index < loops ; index++) {
      buffer += `${req.method} Doing crazy stuff with the event loop ${index}`;
  }
  res.end('Hello world! ' + new Date() + ' ' + buffer.length);
}).listen(8080, () => {
  console.log('Server started on port 8080');
  monitor();
});
