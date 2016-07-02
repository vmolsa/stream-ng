var fs = require('fs');
var StreamNg = require('../index.js');
var stream = require('stream');

var out = fs.openSync('./out', 'w');
var out2 = fs.openSync('./out2', 'w');

function testStreamNG(callback) {
  var time = Date.now();

  var writable = new StreamNg({ objectMode: true, write: function(chunk, next) {
    fs.write(out, chunk, 0, chunk.length, next);
  }});

  writable.then(function() {
    var end = Date.now();
    console.log('StreamNG Done: ' + (end - time) + 'ms');
    setImmediate(callback);
  }).catch(function(error) {
    throw error;
  }).open(function() {
    console.log('Open');
  }).close(function() {
    console.log('Close');
  }).drain(function() {
    console.log('Drain');
  }).pause(function() {
    console.log('Pause');
  }).resume(function() {
    console.log('Resume');
  });
  
  for (var index = 0; index < 1024; index++) {
    writable.write(new Buffer(1024 * 10 + index));
  }
  
  writable.end('Done!');
}

function testStream(callback) {
  var time = Date.now();
  
  var writable = new stream.Writable({ objectMode: true, write: function(chunk, encoding, next) {
    fs.write(out2, chunk, 0, chunk.length, next);
  }});

  writable.on('finish', function() {
    var end = Date.now();
    console.log('Stream Done: ' + (end - time) + 'ms');
    setImmediate(callback);
  });
  
  for (var index = 0; index < 1024; index++) {
    writable.write(new Buffer(1024 * 10 + index));
  }
  
  writable.end();
}

testStream(function() {
  testStreamNG(function() {
    fs.closeSync(out);
    fs.closeSync(out2);
  });
});
