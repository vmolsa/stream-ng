
/*
 * Stream-NG - Next generation of Stream interface for NodeJS
 *
 * Copyright (c) 2016 vmolsa <ville.molsa@gmail.com> (http://github.com/vmolsa)
 * MIT License <https://github.com/vmolsa/stream-ng/blob/master/LICENSE>
 *
 */

function once(callback, self) {
  return function() {
    switch (arguments.length) {
      case 0:
        callback.call(self || this);
        break;
      case 1:
        callback.call(self || this, arguments[0]);
        break;
      case 2:
        callback.call(self || this, arguments[0], arguments[1]);
        break;
      case 3:
        callback.call(self || this, arguments[0], arguments[1], arguments[1]);
        break;
      default:
        callback.apply(self || this, Array.prototype.slice.call(args));
        break;
    }

    callback = undefined;
  };
}

var STREAM_OPENING = 1 << 1;
var STREAM_RUNNING = 1 << 2;
var STREAM_CLOSING = 1 << 3
var STREAM_CLOSED  = 1 << 4;

function Stream(options) {
  if (!(this instanceof Stream)) {
    return new Stream(options);
  }

  options = options || {};

  var _resolve = undefined;
  var _reject = undefined;

  var promise = new Promise(function(onFulfilled, onRejected) {
    _resolve = onFulfilled;
    _reject = onRejected;
  });

  promise.then(function() {
    promise._fulfilled = true;
  }, function(error) {
    promise._rejected = true;
  });

  Object.setPrototypeOf(promise, Stream.prototype);
  
  promise._fulfilled = false;
  promise._rejected = false;
  promise._resolve = _resolve;
  promise._reject = _reject;
  promise.maxThresholdSize = options.maxThresholdSize || 16384;
  promise.objectMode = options.objectMode || false;
  promise.state = options.state || STREAM_RUNNING;
  promise.threshold = 0;

  promise.onopen = [];
  promise.onclose = [];
  promise.ondata = [];
  promise.ondrain = [];
  promise.onpause = [];
  promise.onresume = [];
  
  if (typeof(options.write) == 'function') {
    promise._write = options.write;
  }

  return promise;
}

Object.setPrototypeOf(Stream.prototype, Promise.prototype);
Object.setPrototypeOf(Stream, Promise);

Object.defineProperty(Stream.prototype, 'readable', {
  enumerable: true,
  configurable: true,
  get: function() { return (this.ondata && this.state & (STREAM_OPENING | STREAM_RUNNING | STREAM_CLOSING)) ? true : false; },  
});

Object.defineProperty(Stream.prototype, 'writable', {
  enumerable: true,
  configurable: true,
  get: function() { return (this._write && this.state & (STREAM_OPENING | STREAM_RUNNING | STREAM_CLOSING)) ? true : false; },  
});

Object.defineProperty(Stream.prototype, 'isOpening', {
  enumerable: true,
  configurable: true,
  get: function() { return (this.state & STREAM_OPENING) ? true : false; },  
});

Object.defineProperty(Stream.prototype, 'isRunning', {
  enumerable: true,
  configurable: true,
  get: function() { return (this.state & STREAM_RUNNING) ? true : false; },   
});

Object.defineProperty(Stream.prototype, 'isClosing', {
  enumerable: true,
  configurable: true,
  get: function() { return (this.state & STREAM_CLOSING) ? true : false; },   
});

Object.defineProperty(Stream.prototype, 'isClosed', {
  enumerable: true,
  configurable: true,
  get: function() { return (this.state & STREAM_CLOSED) ? true : false; },    
});

Object.defineProperty(Stream.prototype, 'pending', {
  enumerable: true,
  configurable: true,
  get: function() { return (!this._fulfilled && !this._rejected) },    
});

Object.defineProperty(Stream.prototype, 'fulfilled', {
  enumerable: true,
  configurable: true,
  get: function() { return this._fulfilled },    
});

Object.defineProperty(Stream.prototype, 'rejected', {
  enumerable: true,
  configurable: true,
  get: function() { return this._rejected },    
});

Object.defineProperty(Stream, 'OPENING', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: STREAM_OPENING,
});

Object.defineProperty(Stream, 'RUNNING', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: STREAM_RUNNING,
});

Object.defineProperty(Stream, 'CLOSING', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: STREAM_CLOSING,
});

Object.defineProperty(Stream, 'CLOSED', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: STREAM_CLOSED,
});

Stream.prototype.then = function(onFulfilled, onRejected) {
  Promise.prototype.then.call(this, onFulfilled, onRejected);
  return this;
};

Stream.prototype.catch = function(onRejected) {
  Promise.prototype.catch.call(this, onRejected);
  return this;
};

Stream.prototype.setState = function(state) {
  var self = this;
  
  if (state & STREAM_OPENING && self.state & STREAM_CLOSED) {
    self.state = STREAM_OPENING;
  } else if (state & STREAM_RUNNING && self.state & STREAM_OPENING) {
    self.state = STREAM_RUNNING;
    
    self.onopen.forEach(function(callback) {
      try {
        callback.call(self);
      } catch(error) {
        self.end(error);
      }
    });
    
    self.onopen = [];
  } else if (state & STREAM_CLOSING && self.state & (STREAM_OPENING | STREAM_RUNNING)) {
    self.state = STREAM_CLOSING;
  } else if (state & STREAM_CLOSED && self.state & ~(STREAM_CLOSED)) {
    self.state = STREAM_CLOSED;

    self.onclose.forEach(function(callback) {
      try {
        callback.call(self);
      } catch(error) {
        self.end(error);
      }
    });
    
    self.onclose = [];
  }
  
  return self;
};

Stream.prototype.close = function(onClose) {
  var self = this;
  
  if (typeof(onClose) === 'function') {
    if (self.state & (STREAM_OPENING | STREAM_RUNNING | STREAM_CLOSING)) {
      self.onclose.push(onClose);
    } else {
      onClose.call(self);
    }
  }
  
  return self;
};

Stream.prototype.open = function(onOpen) {
  var self = this;

  if (typeof(onOpen) === 'function') {
    if (self.state & STREAM_OPENING) {
      self.onopen.push(onOpen);
    } else {
      if (self.state & (STREAM_RUNNING | STREAM_CLOSING)) {
        onOpen.call(self);
      }
    }
  }
  
  return self;
};

Stream.prototype.data = function(onData) {
  var self = this;
  
  if (typeof(onData) === 'function') {
    self.onopen.push(onData);
  }
  
  return self;
};

Stream.prototype.drain = function(onDrain) {
  var self = this;
  
  if (typeof(onDrain) === 'function') {
    setImmediate(function(self, onDrain) {
      if (self.heap) {
        self.ondrain.push(onDrain);
      } else {
        onDrain.call(self);
      }
    }, self, onDrain);
  }
  
  return self;
};

Stream.prototype.resume = function(onResume) {
  var self = this;
  
  if (typeof(onResume) === 'function') {
    self.onresume.push(onResume);
  }
  
  return self;
};

Stream.prototype.pause = function(onPause) {
  var self = this;
  
  if (typeof(onPause) === 'function') {
    self.onpause.push(onPause);
  }
  
  return self;
};

Stream.prototype.end = function(arg) {
  var self = this;
  
  if (arg instanceof Error) {
    self.setState(STREAM_CLOSED);
    self._reject(arg);
  } else if (arg && typeof(arg) === 'function') {
    arg.then(function(reply) {
      self.end(reply);
    }, function(error) {
      self.end(error);
    });
  } else {
    if (self.state & (STREAM_RUNNING | STREAM_CLOSING)) {
      self.setState(STREAM_CLOSING);

      self.drain(function() {
        self.setState(STREAM_CLOSED);
        self._resolve(arg);
      });
    } else if (self.state & STREAM_OPENING) {
      self.open(function() {
        self.setState(STREAM_CLOSING);

        self.drain(function() {
          self.setState(STREAM_CLOSED);
          self._resolve(arg);
        });
      });
    } else {
      self._resolve(arg);
    }
  }
  
  return self;
};

Stream.prototype.write = function(chunk, callback) {
  var self = this;
   
  function doWrite(self) {    
    if (self.state & (STREAM_RUNNING | STREAM_CLOSING)) {
      if (self.heap) {
        var data = self.heap;
        
        var afterWrite = once(function(error) {
          if (typeof(data.callback) === 'function') {
            try {
              data.callback(error);
            } catch (error) {
              return self.end(error);
            }
          } else if (error) {
            return self.end(error);
          }

          if (!self.objectMode) {
            var cont = (self.threshold >= self.maxThresholdSize);
            
            self.threshold -= data.chunk.byteLength;
          
            if (cont && (self.threshold < self.maxThresholdSize) && self.waiting) {
              self.waiting = false;
              
              self.onresume.forEach(function(callback) {
                try {
                  callback.call(self);
                } catch(error) {
                  self.end(error);
                }
              });
            }
          }
          
          self.heap = data.next;
          self.heap ? doWrite(self) : setImmediate(function(self) {
            doWrite(self);
          }, self);
        }, self);
        
        try {        
          return self._write.call(self, data.chunk, afterWrite);
        } catch (error) {
          return self.end(error);
        }
      } else {
        if (self.state & (STREAM_RUNNING | STREAM_CLOSING)) {
          self.tail = null;
          
          self.ondrain.forEach(function(callback) {
            try {
              callback.call(self);
            } catch(error) {
              self.end(error);
            }
          });
          
          self.ondrain = [];
        }
      }
    }
  }
  
  if (self.writable) {
    if (!self.objectMode) {
      if (!(chunk instanceof ArrayBuffer) && !ArrayBuffer.isView(chunk)) {
        if (callback) {
          try {
            callback(new TypeError('Invalid chunk. TypedArray / ArrayBuffer Supported.'));
          } catch (error) {
            self.end(error);
          }
        } else {
          self.end(new TypeError('Invalid chunk. TypedArray / ArrayBuffer Supported.'));
        }
        
        return self;
      }
      
      chunk = new Uint8Array(chunk);
    }
    
    var data = {
      chunk: chunk,
      callback: callback,
    };
    
    if (self.heap && self.tail) {
      self.tail.next = data;
      self.tail = data;
    } else {
      self.heap = data;
      self.tail = data;
      
      if (self.state & (STREAM_RUNNING | STREAM_CLOSING)) {
        setImmediate(function(self) {
          doWrite(self);
        }, self);
      } else {
        self.open(function() {
          setImmediate(function(self) {
            doWrite(self);
          }, self);
        });
      }
    }
    
    if (!self.objectMode) {
      self.threshold += data.chunk.byteLength;
      
      if ((self.threshold > self.maxThresholdSize) && !self.waiting) {
        self.waiting = true;
        
        self.onpause.forEach(function(callback) {
          try {
            callback.call(self);
          } catch(error) {
            self.end(error);
          }
        });
      }
    }
  } else {
    if (typeof(callback) === 'function') {
      try {
        callback(new Error('Stream is not writable.'));
      } catch (error) {
        self.end(error);
      }
    } else {
      self.end(new Error('Stream is not writable.'));
    }
  }
  
  return self;
};

Stream.prototype.push = function(chunk, callback) {
  var self = this;
  
  var afterPush = once(function(error) {    
    if (typeof(callback) === 'function') {
      return callback.call(self, error);
    }
    
    if (error) {
      self.end(error);
    }
  });
  
  if (!(chunk instanceof ArrayBuffer) && !ArrayBuffer.isView(chunk) && !self.objectMode) {
    afterPush(new TypeError('Invalid chunk. TypedArray / ArrayBuffer Supported.'));    
    return self;
  }
  
  if (self.readable) {
    self.ondata.forEach(function(onData) {
      try {
        onData.call(self, chunk, afterPush);
      } catch(error) {
        afterPush(error);
      }
    });
  } else {
    afterPush(new Error('Stream is not readable.'));
  }

  return self;
};

Stream.prototype.pair = function(dst, options) {
  var self = this;
  
  options = options || {};
  
  if (dst && typeof(dst.then) === 'function') {
    if (!dst.pending && (!typeof(dst.isPending) === 'function' || !dst.isPending())) {
      return self.end(new Error('Stream has been resolved.'));
    }

    if (typeof(dst.data) === 'function' && 
        typeof(dst.end) === 'function' &&
        typeof(dst.write) === 'function')
    {
      if (!options.noResolve) { 
        dst.then(function(arg) {
          self.end(arg);
        }, function(error) {
          self.end(error);
        });
        
        self.then(function(arg) {
          dst.end(arg);
        }, function(error) {
          dst.end(error);
        });
      }
      
      if (options.checkState && typeof(dst.open) === 'function' && typeof(dst.close) === 'function') {
        dst.open(function() {
          self.setState(STREAM_RUNNING);
        }).close(function() {
          self.setState(STREAM_CLOSED);
        });
      }
      
      if (dst.writable) {
        self.data(function(chunk, next) {
          dst.write(chunk, next);
        });
      }
      
      if (self.writable) {
        dst.data(function(chunk, next) {
          self.write(chunk, next);
        });
      }         
    } else {
      dst.then(function(arg) {
        self.end(arg);
      }, function(error) {
        self.end(error);
      });
    }
  } else {
    try {
      var rejectedByError = false;
      
      function onError(error) {          
        rejectedByError = true;
        self.end(error);
      }
      
      dst.on('error', onError);
      
      function onData(data) {
        self.write(data);
      }
      
      function onClose() {
        if (!rejectedByError) {
          self.end();
        }
      }
      
      function onFinish() {
        if (!dst.readable && !options.noResolve) {
          self.end();
        }
      }
      
      function onEnd() {
        if (!dst.writable && !options.noResolve) {
          self.end();
        }
      }
      
      function removeListeners() {
        dst.removeListener('error', onError);
        dst.removeListener('data', onData);
        dst.removeListener('end', onEnd);
        dst.removeListener('finish', onFinish);
        dst.removeListener('close', onClose);
      }
      
      function onResolve() {
        removeListeners();
        
        if (dst.writable) {
          dst.end();
        }
      }
      
      function onReject(error) {
        removeListeners();

        if (!rejectedByError && error) {
          dst.emit('error', error);
        }
        
        if (dst.writable) {
          dst.end();
        }
      }
      
      function addReadable() {
        if (dst.readable) {
          self.resume(function() {
            dst.resume();
          });
          
          self.pause(function() {
            dst.pause();
          });
          
          dst.on('data', onData);
          dst.on('end', onEnd);
        }
      }
      
      function addWritable() {
        if (dst.writable) {
          self.data(function(chunk, next) {
            if (dst.writable) {
              if (Buffer !== 'undefined') {
                dst.write(new Buffer(chunk), next);
              } else {
                dst.write(chunk, next);
              }
            } else {
              self.end(new Error('Stream is not writable.'));
            }
          });
          
          dst.on('finish', onFinish);
        }
      }
      
      self.then(onResolve, onReject);
      
      if (dst.readable || dst.writable) {
        dst.on('close', onClose);
        
        addWritable();
        
        if (dst.readable) {
          addReadable();
        } else if (self.state & STREAM_OPENING) {
          self.open(function() {
            addReadable();
          });
        }
      }
    } catch (error) {
      self.end(error);
    }
  }
  
  return self;
};

module.exports = Stream;