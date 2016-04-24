
/*
 * Stream-NG - Next generation of Stream interface for NodeJS
 *
 * Copyright (c) 2016 vmolsa <ville.molsa@gmail.com> (http://github.com/vmolsa)
 * MIT License <https://github.com/vmolsa/stream-ng/blob/master/LICENSE>
 *
 */

var _ = {
  isArray: function(arg) {
    return (Object.prototype.toString.call(arg) === '[object Array]');
  },
  isObject: function(arg) {
    return (arg && typeof(arg) === 'object');
  },
  isString: function(arg) {
    return (typeof(arg) === 'string');
  },
  isUndefined: function(arg) {
    return (typeof(arg) === 'undefined');
  },
  isFunction: function(arg) {
    return (typeof(arg) === 'function');
  },
  isNumber: function(arg) {
    return (typeof(arg) === 'number');
  },
  isTypedArray: function(arg) {
    return ArrayBuffer.isView(arg);
  },
  isArrayBuffer: function(arg) {
    return (arg instanceof ArrayBuffer);
  },
  isError: function(arg) {
    return (arg instanceof Error);
  },
  isPromise: function(arg) {
    return (arg && typeof(arg.then) === 'function');
  },
  size: function(arg) {
    if (_.isObject(arg)) {
      return Object.keys(arg).length;
    } else if (_.isArray(arg)) {
      return arg.length;
    } else if (_.isString(arg)) {
      return arg.length;
    } else if (_.isTypedArray(arg) || _.isArrayBuffer(arg)) {
      return arg.byteLength;
    } else {
      return -1;
    }
  },
  now: function() {
    return new Date().getTime();
  },
  extend: function(dst, src) {
    Object.keys(src).forEach(function(key) {
      dst[key] = src[key];
    });
    
    return dst;
  },
  forEach: function(collection, callback) {
    if (_.isFunction(callback)) {
      if (_.isObject(collection)) {
        Object.keys(collection).forEach(function(key) {
          callback(collection[key], key);
        });
      } else if (_.isArray(collection)) {
        collection.forEach(callback);
      }
    }
    return collection;
  },
  once: function(callback, self) {
    return function(arg) {      
      if (callback) {
        callback.apply(self || this, arg);
      }
      
      callback = undefined;
    };
  },
  delay: process.nextTick,
  random: function() {
    return (Math.random() * (-1 >>> 0)) >>> 0;
  },
  sll_add: function(collection, arg) {
    return {
      element: arg,
      next: collection,
    };
  },
  sll_forEach: function(collection, callback) {
    if (_.isFunction(callback)) {
      for (var index = collection; index; index = index.next) {
        callback(index.element);
      }
    }
    
    return collection;
  },
};

function Promise(callback) {
  var self = this;
 
  if (!(self instanceof Promise)) {
    return new Promise(callback);
  }
  
  self.pending = true;
  self.fulfilled = false;
  self.rejected = false;
  
  function onReject(arg) {
    _.delay(function() {    
      if (!self.fulfilled && !self.rejected) {
        self.pending = false;
        self.fulfilled = false;
        self.rejected = true;
        
        _.sll_forEach(self.onreject, function(callback) {
          callback.call(self, arg);
        });
        
        self.destroy(arg);
      }
    });
  }
  
  function onResolve(arg) {
    if (_.isPromise(arg)) {
      arg.then(function(reply) {
        onResolve(reply);
      }, function(error) {
        onReject(error);
      });
    } else {
      _.delay(function() {      
        if (!self.fulfilled && !self.rejected) {
          self.pending = false;
          self.fulfilled = true;
          self.rejected = false;
          
          _.sll_forEach(self.onresolve, function(callback) {
            try {
              callback.call(self, arg);
            } catch(error) {
              onReject(error);
            }
          });

          self.destroy();
        }
      });
    }
  }
  
  if (_.isFunction(callback)) {    
    try {
      callback(onResolve, onReject);
    } catch(error) {
      onReject(error);
    }
  } else {
    throw new Error('Promise resolver ' + typeof(callback) + ' is not a function');
  }
}

Promise.prototype.destroy = function() {
  this.onresolve = null;
  this.onreject = null;
}

Promise.prototype.then = function(onResolve, onReject) {  
  if (this.pending) {
    if (_.isFunction(onResolve)) {
      this.onresolve = _.sll_add(this.onresolve, onResolve);
    }
    
    if (_.isFunction(onReject)) {
      this.onreject = _.sll_add(this.onreject, onReject);
    }
  }
  
  return this;
};

Promise.prototype.catch = function(onReject) {  
  if (this.pending) {
    if (_.isFunction(onReject)) {
      this.onreject = _.sll_add(this.onreject, onReject);
    }
  }
  
  return this;
};

Promise.prototype.finally = function(onResolve) {  
  return this.then(function(arg) {
    onResolve(arg);
  }, function() {
    onResolve(arg);
  });
};

Promise.all = function(collection) {
  return new Promise(function(resolve, reject) {
    var len = _.size(collection);
    
    if (_.isArray(collection) && len) {
      var args = [];
      
      collection.forEach(function(value, index) {
        if (_.isPromise(value)) {
          var curIndex = index;
          
          value.then(function(reply) {
            args[curIndex] = reply;
            len--;
            
            if (!len) {
              resolve(args);
            }
          }).catch(function(error) {
            reject(error);
          });
        } else {
          args[index] = value;
          len--;
            
          if (!len) {
            resolve(args);
          }
        }
      });
    } else {
      resolve([]);
    }
  });
}

Promise.forEach = function(collection, callback) {
  return new Promise(function(resolve, reject) {
    var len = _.size(collection);

    if (len && _.isFunction(callback)) {
      var args = [];
      
      if (_.isArray(collection)) {
        collection.forEach(function(value, index) {
          var curIndex = index;
          var entry = new Promise(function(resolve, reject) {
            try {
              callback(resolve, reject, value, index);
            } catch(error) {
              reject(error); 
            }
          });
          
          entry.then(function(reply) {
            args[curIndex] = reply;
            len--;
            
            if (!len) {
              resolve(args);
            }
          }).catch(function(error) {
            reject(error);
          });
        });
      } else if (_.isObject(collection)) {
        var index = 0;
        
        _.forEach(collection, function(value, key) {
          var curIndex = index;
          var entry = new Promise(function(resolve, reject) {
            try {
              callback(resolve, reject, value, key);
            } catch(error) {
              reject(error); 
            }
          });
          
          entry.then(function(reply) {
            args[curIndex] = reply;
            len--;
            
            if (!len) {
              resolve(args);
            }
          }).catch(function(error) {
            reject(error);
          });
          
          index++;
        });
      } else {
        resolve([collection]);
      }
    } else {
      resolve([]);
    }
  });
}

var STREAM_OPENING = 1 << 1;
var STREAM_RUNNING = 1 << 2;
var STREAM_CLOSING = 1 << 3
var STREAM_CLOSED  = 1 << 4;

function Stream(options) {
  var self = this;
  
  if (!(self instanceof Stream)) {
    return new Stream(options);
  }
  
  options = options || {};
  
  Promise.call(this, function(resolve, reject) {
    self._resolve = resolve;
    self._reject = reject;
  });
  
  self.maxThresholdSize = options.maxThresholdSize || 16384;
  self.objectMode = options.objectMode || false;
  self.state = options.state || STREAM_RUNNING;
  self.threshold = 0;
  
  if (_.isFunction(options.write)) {
    self._write = options.write;
  }
}

Object.setPrototypeOf(Stream.prototype, Promise.prototype);

Object.defineProperty(Stream.prototype, 'readable', {
  enumerable: true,
  configurable: true,
  get: function() { return (this.pending && this.ondata && this.state & (STREAM_OPENING | STREAM_RUNNING | STREAM_CLOSING)) ? true : false; },  
});

Object.defineProperty(Stream.prototype, 'writable', {
  enumerable: true,
  configurable: true,
  get: function() { return (this.pending && this._write && this.state & (STREAM_OPENING | STREAM_RUNNING | STREAM_CLOSING)) ? true : false; },  
});

Object.defineProperty(Stream.prototype, 'isOpening', {
  enumerable: true,
  configurable: true,
  get: function() { return (this.pending && this.state & STREAM_OPENING); },  
});

Object.defineProperty(Stream.prototype, 'isRunning', {
  enumerable: true,
  configurable: true,
  get: function() { return (this.pending && this.state & STREAM_RUNNING) ? true : false; },   
});

Object.defineProperty(Stream.prototype, 'isClosing', {
  enumerable: true,
  configurable: true,
  get: function() { return (this.pending && this.state & STREAM_CLOSING) ? true : false; },   
});

Object.defineProperty(Stream.prototype, 'isClosed', {
  enumerable: true,
  configurable: true,
  get: function() { return (this.pending && this.state & STREAM_CLOSED) ? true : false; },    
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

Stream.prototype.destroy = function(error) {  
  this.heap = null;
  this.tail = null;
  this.threshold = 0;
  this.state = STREAM_CLOSED;
  
  this.onopen = null;
  this.onclose = null;
  this.ondata = null;
  this.ondrain = null;
  this.onpause = null;
  this.onresume = null;
  
  return Promise.prototype.destroy.call(this, error);
};

Stream.prototype.setState = function(state) {
  var self = this;
  
  if (self.pending) {
    if (state & STREAM_OPENING && self.state & STREAM_CLOSED) {
      self.state = STREAM_OPENING;
    } else if (state & STREAM_RUNNING && self.state & STREAM_OPENING) {
      self.state = STREAM_RUNNING;
      
      _.sll_forEach(self.onopen, function(callback) {
        try {
          callback.call(self);
        } catch(error) {
          self.end(error);
        }
      });
      
      self.onopen = null;
    } else if (state & STREAM_CLOSING && self.state & (STREAM_OPENING | STREAM_RUNNING)) {
      self.state = STREAM_CLOSING;
    } else if (state & STREAM_CLOSED && self.state & ~(STREAM_CLOSED)) {
      self.state = STREAM_CLOSED;
      
      _.sll_forEach(self.onclose, function(callback) {
        try {
          callback.call(self);
        } catch(error) {
          self.end(error);
        }
      });
      
      self.onclose = null;
    }
  }
  
  return self;
};

Stream.prototype.close = function(onClose) {
  var self = this;
  
  if (self.pending) {
    if (self.state & (STREAM_OPENING | STREAM_RUNNING | STREAM_CLOSING)) {
      if (_.isFunction(onClose)) {
        self.onclose = _.sll_add(self.onclose, onClose);
      }
    } else {
      if (_.isFunction(onClose)) {
        onClose.call(self);
      }
    }
  }
  
  return self;
};

Stream.prototype.open = function(onOpen) {
  var self = this;
  
  if (self.pending) {
    if (self.state & STREAM_OPENING) {
      if (_.isFunction(onOpen)) {
        self.onopen = _.sll_add(self.onopen, onOpen);
      }
    } else {
      if (self.state & (STREAM_RUNNING | STREAM_CLOSING) && _.isFunction(onOpen)) {
        onOpen.call(self);
      }
    }
  }
  
  return self;
};

Stream.prototype.data = function(onData) {
  var self = this;
  
  if (self.pending) {
    if (_.isFunction(onData)) {
      self.ondata = _.sll_add(self.ondata, onData);
    }
  }
  
  return self;
};

Stream.prototype.drain = function(onDrain) {
  var self = this;
  
  _.delay(function() {
    if (self.pending) {
      if (self.heap) {
        if (_.isFunction(onDrain)) {
          self.ondrain = _.sll_add(self.ondrain, onDrain);
        }
      } else {
        if (_.isFunction(onDrain)) {
          onDrain.call(self);
        }
      }
    }
  });
  
  return self;
};

Stream.prototype.resume = function(onResume) {
  var self = this;
  
  if (self.pending) {
    if (_.isFunction(onResume)) {
      self.onresume = _.sll_add(self.onresume, onResume);
    }
  }
  
  return self;
};

Stream.prototype.pause = function(onPause) {
  var self = this;
  
  if (self.pending) {
    if (_.isFunction(onPause)) {
      self.onpause = _.sll_add(self.onpause, onPause);
    }
  }
  
  return self;
};

Stream.prototype.end = function(arg) {
  var self = this;
  
  if (_.isError(arg)) {
    self._reject(arg);
  } else if (_.isPromise(arg)) {
    arg.then(function(reply) {
      self.end(reply);
    }, function(error) {
      self.end(error);
    });
  } else {
    if (self.state & (STREAM_RUNNING | STREAM_CLOSING)) {      
      self.drain(function() {
        self._resolve(arg);
      });
    } else if (self.state & STREAM_OPENING) {
      self.open(function() {
        self.drain(function() {
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
    if (self.pending && self.state & (STREAM_RUNNING | STREAM_CLOSING)) {
      if (self.heap) {
        var data = self.heap;
        
        var afterWrite = _.once(function(error) {
          if (_.isFunction(data.callback)) {
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
              
              _.sll_forEach(self.onresume, function(callback) {
                try {
                  callback.call(self);
                } catch(error) {
                  self.end(error);
                }
              });
            }
          }
          
          self.heap = data.next;
          self.heap ? doWrite(self) : _.delay(function(self) {
            doWrite(self);
          }, self);
        });
        
        try {        
          return self._write.call(self, data.chunk, afterWrite);
        } catch (error) {
          return self.end(error);
        }
      }
        
      self.tail = null;
      
      _.sll_forEach(self.ondrain, function(callback) {
        try {
          callback.call(self);
        } catch(error) {
          self.end(error);
        }
      });
      
      self.ondrain = null;
    }
  }
  
  if (self.writable) {
    if (!self.objectMode) {
      if (!_.isTypedArray(chunk) && !_.isArrayBuffer(chunk)) {
        if (_.isFunction(callback)) {
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
        _.delay(function(self) {
          doWrite(self);
        }, self);
      } else {
        self.open(function() {
          _.delay(function(self) {
            doWrite(self);
          }, self);
        });
      }
    }
    
    if (!self.objectMode) {
      self.threshold += data.chunk.byteLength;
      
      if ((self.threshold > self.maxThresholdSize) && !self.waiting) {
        self.waiting = true;
        
        _.sll_forEach(self.onpause, function(callback) {
          try {
            callback.call(self);
          } catch(error) {
            self.end(error);
          }
        });
      }
    }
  } else {
    if (_.isFunction(callback)) {
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
  var afterPush;
  
  if (_.isFunction(callback)) {
    afterPush = _.once(callback);
  } else {
    afterPush = _.once(function(error) {
      if (error) {
        self.end(error);
      }
    });
  }
  
  if (!_.isTypedArray(chunk) && !_.isArrayBuffer(chunk) && !self.objectMode) {
    afterPush(new TypeError('Invalid chunk. TypedArray / ArrayBuffer Supported.'));    
    return self;
  }
  
  if (self.readable) {
    for (var index = self.ondata; index; index = index.next) {
      try {
        index.callback.call(self, chunk, afterPush);
      } catch(error) {
        return self.end(error);
      }
    }
  } else {
    afterPush(new Error('Stream is not readable.'));
  }

  return self;
};

Stream.prototype.pair = function(dst, options) {
  var self = this;
  
  options = options || {};
  
  if (self.pending) {
    if (_.isPromise(dst)) {
      if (!dst.pending && (!_.isFunction(dst.isPending) || !dst.isPending())) {
        return self.end(new Error('Stream has been resolved.'));
      }

      if (_.isFunction(dst.data) && 
          _.isFunction(dst.end) &&
          _.isFunction(dst.write))
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
        
        if (options.checkState && _.isFunction(dst.open) && _.isFunction(dst.close)) {
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
  }
  
  return self;
};

Stream._ = _;
Stream.Promise = Promise;

module.exports = Stream;