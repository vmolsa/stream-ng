const net = require('net');
const StreamSocket = require('./tcp-socket.js');
let socket = StreamSocket(net.connect({port: 8124}));

let times = 10;
let msgid = 0;

socket.then(() => {
  console.log('Connection Done!');
}).catch((error) => {
  console.log(error);
}).data((chunk, next) => {
  console.log('Data', msgid++ + ':', new Buffer.from(chunk).toString());
  next();

  if (times) {
    socket.write(new Buffer.from('PING', 'utf8'));
    times--;
  } else {
    socket.end();
  }
}).open(() => {
  console.log('Connected!');
}).close(() => {
  console.log('Disconnected!');
});

socket.write(new Buffer.from('PING', 'utf8'));


