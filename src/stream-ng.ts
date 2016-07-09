/*
 * Stream-NG - Next generation of Stream interface for NodeJS
 *
 * Copyright (c) 2016 vmolsa <ville.molsa@gmail.com> (http://github.com/vmolsa)
 * MIT License <https://github.com/vmolsa/stream-ng/blob/master/LICENSE>
 *
 */

export declare type TypedArray = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array | Uint8ClampedArray;
export declare type onResolve = (arg: any) => void;
export declare type onReject = (error: any) => void;
export declare type notifyCallback = () => void;
export declare type errorCallback = (error?: Error) => void;
export declare type dataCallback = (chunk: TypedArray, next: errorCallback) => void;

var global = this;

function once(callback:(...restOfArgs: any[]) => void, self:any) {
  return (...restOfArgs: any[]) => {
    if (callback) {
      callback.apply(self || this, restOfArgs);
    }

    callback = undefined;
  };
}

export class SimplePromise {
  private _fulfilled: boolean = false;
  private _rejected: boolean = false;
  private _onresolve: Array<onResolve> = new Array<onResolve>();
  private _onreject: Array<onReject> = new Array<onReject>();

  public get pending(): boolean {
    return (!this._fulfilled && !this._rejected);
  }

  public get fulfilled(): boolean {
    return this._fulfilled;
  }

  public get rejected(): boolean {
    return this._rejected;
  }

  public _resolve(arg:any): SimplePromise {
    setImmediate((self: SimplePromise, arg:any) => {
      if (self.pending) {
        self._fulfilled = true;
        
        self._onresolve.forEach((callback) => {
          callback.call(self, arg);
        });
      }
    }, this, arg);

    return this;
  }

  public _reject(error:any): SimplePromise {
    setImmediate((self: SimplePromise, error:any) => {
      if (self.pending) {
        self._rejected = true;

        self._onreject.forEach((callback) => {
          callback.call(self, error);
        });
      }
    }, this, error);

    return this;
  }

  public then(onFulfilled: onResolve, onRejected?: onReject): SimplePromise {
    if (this.pending) {
      if (onFulfilled) {
        this._onresolve.push(onFulfilled);
      }

      if (onRejected) {
        this._onreject.push(onRejected);
      }
    }

    return this;
  }

  public catch(onRejected: onReject): SimplePromise {
    if (this.pending) {
      if (onRejected) {
        this._onreject.push(onRejected);
      }
    }

    return this;
  }
}

export enum StreamStates {
  OPENING = 1 << 1,
  RUNNING = 1 << 2,
  CLOSING = 1 << 3,
  CLOSED = 1 << 4,
}

export interface StreamOptions {
  maxThresholdSize?: number;
  objectMode?: boolean;
  state?: StreamStates;
  write?: dataCallback;
}

export interface StreamData {
  chunk: TypedArray,
  callback?: errorCallback,
}

export class StreamNg extends SimplePromise {
  private _maxThresholdSize: number = 16384;
  private _threshold: number = 0;
  private _objectMode: boolean = false;
  private _state: StreamStates = StreamStates.RUNNING;
  private _onopen: Array<notifyCallback> = new Array<notifyCallback>();
  private _onclose: Array<notifyCallback> = new Array<notifyCallback>();
  private _ondata: Array<dataCallback> = new Array<dataCallback>();
  private _ondrain: Array<notifyCallback> = new Array<notifyCallback>();
  private _onresume: Array<notifyCallback> = new Array<notifyCallback>();
  private _onpause: Array<notifyCallback> = new Array<notifyCallback>();
  private _data: Array<StreamData> = new Array<StreamData>();
  private _waiting: boolean = false;

  protected _write: dataCallback;

  constructor(options?:StreamOptions) {
    super();

    if (options) {
      if (options.maxThresholdSize) {
        this._maxThresholdSize = options.maxThresholdSize;
      }

      if (options.objectMode) {
        this._objectMode = options.objectMode;
      }

      if (options.state) {
        this._state = options.state;
      }

      if (options.write) {
        this._write = options.write;
      }
    }
  }

  public get readable(): boolean {
    return (this._ondata.length && this._state & (StreamStates.OPENING | StreamStates.RUNNING | StreamStates.CLOSING)) ? true : false;
  }
  
  public get writable(): boolean {
    return (this._write && this._state & (StreamStates.OPENING | StreamStates.RUNNING | StreamStates.CLOSING)) ? true : false;
  }

  public get isOpening(): boolean {
    return this._state === StreamStates.OPENING;
  }

  public get isRunning(): boolean {
    return this._state === StreamStates.RUNNING;
  }

  public get isClosing(): boolean {
    return this._state === StreamStates.CLOSING;
  }

  public get isClosed(): boolean {
    return this._state === StreamStates.CLOSED;
  }

  public get state(): StreamStates {
    return this._state;
  }

  public setState(state: StreamStates): StreamNg {
    var self = this;

    if (state & StreamStates.OPENING && self._state & StreamStates.CLOSED) {
      self._state = StreamStates.OPENING;
    } else if (state & StreamStates.RUNNING && self._state & StreamStates.OPENING) {
      self._state = StreamStates.RUNNING;
      
      self._onopen.forEach((callback) => {
        try {
          callback.call(self);
        } catch(error) {
          self.end(error);
        }
      });
      
      self._onopen = new Array<notifyCallback>();
    } else if (state & StreamStates.CLOSING && self._state & (StreamStates.OPENING | StreamStates.RUNNING)) {
      self._state = StreamStates.CLOSING;
    } else if (state & StreamStates.CLOSED && self._state & ~(StreamStates.CLOSED)) {
      self._state = StreamStates.CLOSED;

      self._onclose.forEach((callback) => {
        try {
          callback.call(self);
        } catch(error) {
          self.end(error);
        }
      });
      
      self._onclose = new Array<notifyCallback>();
    }
    
    return self;
  }

  public open(callback: notifyCallback): StreamNg {
    if (this._state & StreamStates.OPENING) {
      this._onopen.push(callback);
    } else {
      if (this._state & (StreamStates.RUNNING | StreamStates.CLOSING)) {
        try {
          callback.call(this);
        } catch(error) {
          this.end(error);
        }
      }
    }
    
    return this;
  }

  public close(callback: notifyCallback): StreamNg {
    if (this._state & (StreamStates.OPENING | StreamStates.RUNNING | StreamStates.CLOSING)) {
      this._onclose.push(callback);
    } else {
      try {
        callback.call(this);
      } catch(error) {
        this.end(error);
      }
    }
    
    return this;
  }

  public pause(callback: notifyCallback): StreamNg {
    this._onpause.push(callback);
    return this;
  }

  public resume(callback: notifyCallback): StreamNg {
    this._onresume.push(callback);
    return this;
  }

  public drain(callback: notifyCallback): StreamNg {
    setImmediate((self: StreamNg, callback: notifyCallback) => {
      if (self.writable) {
        if (self._data.length) {
          this._ondrain.push(callback);
        } else {
          try {
            callback.call(self);
          } catch(error) {
            self.end(error);
          } 
        }
      }
    }, this, callback);
    
    return this;
  }

  public data(callback: dataCallback): StreamNg {
    this._ondata.push(callback);
    return this;
  }

  public end(arg?: any): StreamNg {
    var self = this;

    if (arg instanceof Error) {
      self.setState(StreamStates.CLOSED);
      self._reject(arg);
    } else if (arg && arg.then && arg.catch) {
      arg.then((reply:any) => {
        self.end(reply);
      }, (error:any) => {
        self.end(error);
      });
    } else if (self._state & (StreamStates.RUNNING | StreamStates.CLOSING)) {
      self.setState(StreamStates.CLOSING);

      self.drain(() => {
        self.setState(StreamStates.CLOSED);
        self._resolve(arg);
      });
    } else if (self._state & StreamStates.OPENING) {
      self.open(() => {
        self.setState(StreamStates.CLOSING);

        self.drain(() => {
          self.setState(StreamStates.CLOSED);
          self._resolve(arg);
        });
      });
    } else {
      self._resolve(arg);
    }

    return self;
  }

  private dispatchQueue(): StreamNg {
    var self = this;

    if (self._state & (StreamStates.RUNNING | StreamStates.CLOSING)) {
      if (self._data.length) {
        var data = self._data.pop();
        
        var afterWrite = once((error) => {
          if (data.callback) {
            try {
              data.callback(error);
            } catch (error) {
              return self.end(error);
            }
          } else if (error) {
            return self.end(error);
          }

          if (!self._objectMode) {
            var cont = (self._threshold >= self._maxThresholdSize);
            
            self._threshold -= data.chunk.byteLength;
          
            if (cont && (self._threshold < self._maxThresholdSize) && self._waiting) {
              self._waiting = false;
              
              self._onresume.forEach((onResume) => {
                try {
                  onResume.call(self);
                } catch(error) {
                  self.end(error);
                }
              });
            }
          }
          
          self._data.length ? self.dispatchQueue() : setImmediate((self: StreamNg) => {
            self.dispatchQueue();
          }, self);
        }, self);
        
        try {        
          return self._write.call(self, data.chunk, afterWrite);
        } catch (error) {
          return self.end(error);
        }
      } else {
        if (self._state & (StreamStates.RUNNING | StreamStates.CLOSING)) {            
          self._ondrain.forEach((onDrain) => {
            try {
              onDrain.call(self);
            } catch(error) {
              self.end(error);
            }
          });
          
          self._ondrain = new Array<notifyCallback>();
        }
      }
    }

    return self;
  }

  public write(chunk: TypedArray, callback?:errorCallback): StreamNg {
    var self = this;
   
    if (self.writable) {
      if (!self._objectMode) {
        chunk = new Uint8Array(chunk.buffer);
      }
      
      var data: StreamData = {
        chunk: chunk,
        callback: callback,
      };
      
      if (self._data.length) {
        self._data.unshift(data);
      } else {
        self._data.unshift(data);

        if (self._state & (StreamStates.RUNNING | StreamStates.CLOSING)) {
          setImmediate((self: StreamNg) => {
            self.dispatchQueue();
          }, self);
        } else {
          self.open(() => {
            setImmediate((self: StreamNg) => {
              self.dispatchQueue();
            }, self);
          });
        }
      }
      
      if (!self._objectMode) {
        self._threshold += data.chunk.byteLength;
        
        if ((self._threshold > self._maxThresholdSize) && !self._waiting) {
          self._waiting = true;
          
          self._onpause.forEach((onPause) => {
            try {
              onPause.call(self);
            } catch(error) {
              self.end(error);
            }
          });
        }
      }
    } else {
      if (callback) {
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
  }

  public push(chunk: TypedArray, callback?:errorCallback): StreamNg {
    var self = this;
  
    var afterPush = once((error) => {    
      if (callback) {
        return callback.call(self, error);
      }
      
      if (error) {
        self.end(error);
      }
    }, self);

    if (self.readable) {
      self._ondata.forEach((onData) => {
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
  }

  public pair(dst:any, options:any): StreamNg {
    var self = this;
    
    options = options || {};
    
    if (dst && dst.then && dst.catch) {
      if (!dst.pending) {
        return self.end(new Error('Stream has been resolved.'));
      }

      if (dst.data && dst.end && dst.write) {
        if (!options.noResolve) { 
          dst.then((arg:any) => {
            self.end(arg);
          }, (error:any) => {
            self.end(error);
          });
          
          self.then((arg) => {
            dst.end(arg);
          }, (error) => {
            dst.end(error);
          });
        }
        
        if (options.checkState && dst.open && dst.close) {
          dst.open(() => {
            self.setState(StreamStates.RUNNING);
          }).close(() => {
            self.setState(StreamStates.CLOSED);
          });
        }
        
        if (dst.writable) {
          self.data((chunk, next) => {
            dst.write(chunk, next);
          });
        }
        
        if (self.writable) {
          dst.data((chunk: TypedArray, next: errorCallback) => {
            self.write(chunk, next);
          });
        }         
      } else {
        dst.then((arg:any) => {
          self.end(arg);
        }, (error:any) => {
          self.end(error);
        });
      }
    } else {
      try {
        var rejectedByError = false;
        
        function onError(error:any) {          
          rejectedByError = true;
          self.end(error);
        }
        
        dst.on('error', onError);
        
        function onData(data:any) {
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
        
        function onReject(error:any) {
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
            self.resume(() => {
              dst.resume();
            });
            
            self.pause(() => {
              dst.pause();
            });
            
            dst.on('data', onData);
            dst.on('end', onEnd);
          }
        }
        
        function addWritable() {
          if (dst.writable) {
            self.data((chunk, next) => {
              if (dst.writable) {
                if (global.Buffer !== 'undefined') {
                  dst.write(new global.Buffer(chunk), next);
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
          } else if (self._state & StreamStates.OPENING) {
            self.open(() => {
              addReadable();
            });
          }
        }
      } catch (error) {
        self.end(error);
      }
    }
    
    return self;
  }
}

export default StreamNg;