const net = require('net');
const StreamSocket = require('./tcp-socket.js');
const server = net.createServer((client) => {
  let socket = StreamSocket(client);
  let msgid = 0;

  socket.then(() => {
    console.log('Connection Done!');
  }).catch((error) => {
    console.log(error);
  }).data((chunk, next) => {
    console.log('Data', msgid++ + ':', new Buffer.from(chunk).toString());
    next();

    socket.write(new Buffer.from('PONG', 'utf8'));
  }).open(() => {
    console.log('Connected!');
  }).close(() => {
    console.log('Disconnected!');
  });
});

server.on('error', (err) => {
  throw err;
});

server.listen(8124, () => {
  console.log('Waiting connections...');
});