var fs = require('fs');
var StreamNG = require('../index.js');
var stream = require('stream');
var _ = StreamNG._;

var out = fs.openSync('./out', 'w');
var out2 = fs.openSync('./out2', 'w');

function testStreamNG(callback) {
  var time = _.now();

  var writable = new StreamNG({ objectMode: true, write: function(chunk, next) {
    fs.write(out, chunk, 0, chunk.length, next);
  }});

  writable.then(function() {
    var end = _.now();
    console.log('StreamNG Done: ' + (end - time) + 'ms');
    _.delay(callback);
  }).catch(function(error) {
    throw error;
  });
  
  for (var index = 0; index < 1024; index++) {
    writable.write(new Buffer(1024 * 10 + index));
  }
  
  writable.end();
}

function testStream(callback) {
  var time = _.now();
  
  var writable = new stream.Writable({ objectMode: true, write: function(chunk, encoding, next) {
    fs.write(out2, chunk, 0, chunk.length, next);
  }});

  writable.on('finish', function() {
    var end = _.now();
    console.log('Stream Done: ' + (end - time) + 'ms');
    _.delay(callback);
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
