var StreamNg = require('../dist/stream-ng.js');

module.exports = function(socket) {
  let stream = new StreamNg.Stream({ objectMode: false, state: StreamNg.State.OPENING, write: (chunk, next) => {
    socket.write(new Buffer.from(chunk), next);
  }});

  let state = StreamNg.State.OPENING;

  socket.on('end', () => {
    state = StreamNg.State.CLOSING;
    stream.setState(StreamNg.State.CLOSING);
  });

  socket.on('close', () => {
    stream.end();
  });

  socket.on('error', (error) => {
    stream.end(error);
  });

  socket.on('data', (data) => {
    socket.pause();

    stream.push(data.buffer, (error) => {
      if (error) {
        return stream.end(error);
      }

      socket.resume();
    });
  });

  if (socket.connecting) {
    socket.on('connect', () => {
      state = StreamNg.State.RUNNING;
      stream.setState(StreamNg.State.RUNNING);
    });
  } else if (!socket.destroyed) {
    state = StreamNg.State.RUNNING;
    stream.setState(StreamNg.State.RUNNING);
  } else {
    state = StreamNg.State.CLOSED;
    stream.setState(StreamNg.State.CLOSED);
  }

  stream.then(() => {
    if (state & (StreamNg.State.OPENING | StreamNg.State.RUNNING | StreamNg.State.CLOSING)) {
      socket.end();
    }
    
  }).catch((error) => {
    if (state & (StreamNg.State.OPENING | StreamNg.State.RUNNING | StreamNg.State.CLOSING)) {
      socket.destroy(error);
    }
  });

  return stream;
}