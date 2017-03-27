/*
 * Stream-NG - Next generation of Stream interface for NodeJS
 *
 * Copyright (c) 2016 vmolsa <ville.molsa@gmail.com> (http://github.com/vmolsa)
 * MIT License <https://github.com/vmolsa/stream-ng/blob/master/LICENSE>
 *
 */

var global = this;

export declare type TypedArray = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array | Uint8ClampedArray;
export declare type notifyCallback = () => void;
export declare type errorCallback = (error?: Error) => void;
export declare type resolveCallback = (result?: any) => void;
export declare type rejectCallback = (error: Error) => void;
export declare type dataCallback = (chunk: TypedArray | any, next: errorCallback) => void;
export declare type endCallback = (resolve: resolveCallback, reject: rejectCallback, arg?: any) => void;

export function once(callback:(...restOfArgs: any[]) => void, self?:any) {
  return (...restOfArgs: any[]) => {
    if (callback) {
      callback.apply(self || this, restOfArgs);
    }

    callback = undefined;
  };
}

export function isTypedArray(arg: any) {
  return (arg instanceof ArrayBuffer || ArrayBuffer.isView(arg));
}

export enum State {
  OPENING = 1 << 1,
  RUNNING = 1 << 2,
  CLOSING = 1 << 3,
  CLOSED = 1 << 4,
}

export interface Options {
  maxThresholdSize?: number;
  objectMode?: boolean;
  state?: State;
  write?: dataCallback;
  end?: endCallback;
}

interface Data {
  chunk: TypedArray;
  callback?: errorCallback;
}

export class Stream {
  private _maxThresholdSize: number = 16384;
  private _threshold: number = 0;
  private _objectMode: boolean = false;
  private _state: State = State.RUNNING;
  private _onopen: Array<notifyCallback> = new Array<notifyCallback>();
  private _onclose: Array<notifyCallback> = new Array<notifyCallback>();
  private _ondata: Array<dataCallback> = new Array<dataCallback>();
  private _ondrain: Array<notifyCallback> = new Array<notifyCallback>();
  private _onresume: Array<notifyCallback> = new Array<notifyCallback>();
  private _onpause: Array<notifyCallback> = new Array<notifyCallback>();
  private _data: Array<Data> = new Array<Data>();
  private _waiting: boolean = false;
  private _promise: Promise<any>;
  private _resolve: (arg: any) => void;
  private _reject: (error: Error) => void;

  protected _end: endCallback;
  protected _write: dataCallback;

  constructor(options?: Options) {
    this._promise = new Promise<any>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });

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

      if (options.end) {
        this._end = options.end;
      }
    }
  }

  public then(resolve: any, reject?: any) : Stream {
    this._promise.then(resolve, reject);
    return this;
  }

  public catch(reject: any) : Stream {
    this._promise.catch(reject);
    return this;
  }

  public finally(callback: any) : Stream {
    this._promise.then(() => {
      callback();
    }, () => {
      callback();
    });

    return this;
  }

  public get readable(): boolean {
    return (this._ondata.length && this._state & (State.OPENING | State.RUNNING | State.CLOSING)) ? true : false;
  }
  
  public get writable(): boolean {
    return (this._write && this._state & (State.OPENING | State.RUNNING | State.CLOSING)) ? true : false;
  }

  public get isOpening(): boolean {
    return this._state === State.OPENING;
  }

  public get isRunning(): boolean {
    return this._state === State.RUNNING;
  }

  public get isClosing(): boolean {
    return this._state === State.CLOSING;
  }

  public get isClosed(): boolean {
    return this._state === State.CLOSED;
  }

  public get state(): State {
    return this._state;
  }

  public setState(state: State): Stream {
    var self = this;

    if (state & State.OPENING && self._state & State.CLOSED) {
      self._state = State.OPENING;
    } else if (state & State.RUNNING && self._state & State.OPENING) {
      self._state = State.RUNNING;
      
      self._onopen.forEach((callback) => {
        try {
          callback.call(self);
        } catch(error) {
          self.end(error);
        }
      });
      
      self._onopen = new Array<notifyCallback>();
    } else if (state & State.CLOSING && self._state & (State.OPENING | State.RUNNING)) {
      self._state = State.CLOSING;
    } else if (state & State.CLOSED && self._state & ~(State.CLOSED)) {
      self._state = State.CLOSED;

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

  public open(callback: notifyCallback): Stream {
    if (this._state & State.OPENING) {
      this._onopen.push(callback);
    } else {
      if (this._state & (State.RUNNING | State.CLOSING)) {
        try {
          callback.call(this);
        } catch(error) {
          this.end(error);
        }
      }
    }
    
    return this;
  }

  public close(callback: notifyCallback): Stream {
    if (this._state & (State.OPENING | State.RUNNING | State.CLOSING)) {
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

  public pause(callback: notifyCallback): Stream {
    this._onpause.push(callback);
    return this;
  }

  public resume(callback: notifyCallback): Stream {
    this._onresume.push(callback);
    return this;
  }

  public drain(callback: notifyCallback): Stream {
    setImmediate((self: Stream, callback: notifyCallback) => {
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
      } else {
        try {
          callback.call(self);
        } catch(error) {
          self.end(error);
        }
      }
    }, this, callback);
    
    return this;
  }

  public data(callback: dataCallback): Stream {
    this._ondata.push(callback);
    return this;
  }

  public end(arg?: any): Stream {
    let self = this;

    if (arg && arg.then && arg.catch) {
      arg.then((res: any) => {
        self.end(res);
      }).catch((error:any) => {
        self.end(error);
      });

      return self;
    }

    if (arg instanceof Error) {
      self.setState(State.CLOSING);

      if (self._end) {
        self._end((result?: any) => {
          self.setState(State.CLOSED);
          self._resolve(result);
        }, (error: Error) => {
          self.setState(State.CLOSED);
          self._reject(error);
        }, arg);
      } else {
        self.setState(State.CLOSED);
        self._reject(arg);
      }
    } else if (self._state & (State.RUNNING | State.CLOSING)) {
      self.setState(State.CLOSING);

      self.drain(() => {
        if (self._end) {
          self._end((result?: any) => {
            self.setState(State.CLOSED);
            self._resolve(result);
          }, (error: Error) => {
            self.setState(State.CLOSED);
            self._reject(error);
          }, arg);
        } else {
          self.setState(State.CLOSED);
          self._resolve(arg);
        }
      });
    } else if (self._state & State.OPENING) {
      self.open(() => {
        self.end(arg);
      });
    } else {
      if (self._end) {
        self._end((result?: any) => {
          self.setState(State.CLOSED);
          self._resolve(result);
        }, (error: Error) => {
          self.setState(State.CLOSED);
          self._reject(error);
        }, arg);
      } else {
        self.setState(State.CLOSED);
        self._resolve(arg);
      }
    }

    return self;
  }

  private dispatchQueue(): Stream {
    var self = this;

    if (self._state & (State.RUNNING | State.CLOSING)) {
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
          
          self._data.length ? self.dispatchQueue() : setImmediate((self: Stream) => {
            self.dispatchQueue();
          }, self);
        }, self);
        
        try {        
          return self._write.call(self, data.chunk, afterWrite);
        } catch (error) {
          return self.end(error);
        }
      } else {
        if (self._state & (State.RUNNING | State.CLOSING)) {            
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

  public write(chunk: TypedArray | any, callback?:errorCallback): Stream {
    var self = this;
  
    if (self.writable) {
      if (!self._objectMode) {
        if (!isTypedArray(chunk)) {
          if (callback) {
            callback(new Error('ObjectMode disabled'));
            return self;
          } else {
            return self.end(new Error('ObjectMode disabled'));
          }
        }

        chunk = new Uint8Array(chunk);
      }
      
      var data: Data = {
        chunk: chunk,
        callback: callback,
      };
      
      if (self._data.length) {
        self._data.unshift(data);
      } else {
        self._data.unshift(data);

        if (self._state & (State.RUNNING | State.CLOSING)) {
          setImmediate((self: Stream) => {
            self.dispatchQueue();
          }, self);
        } else {
          self.open(() => {
            setImmediate((self: Stream) => {
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

  public push(chunk: TypedArray | any, callback?:errorCallback): Stream {
    var self = this;
  
    if (self._objectMode && !isTypedArray(chunk)) {
      if (callback) {
        callback(new Error('ObjectMode disabled'));
        return self;
      } else {
        return self.end(new Error('ObjectMode disabled'));
      }
    }

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

  public pipe(dst:Stream): Stream {
    var self = this;

    dst.then((arg: any) => {
      self.end(arg);
    }).catch((error:any) => {
      self.end(error);
    });

    if (dst.isOpening && self.isOpening) {
      dst.open(() => {
        self.setState(State.RUNNING);
      });
    } 

    dst.close(() => {
      self.setState(State.CLOSED);
    });

    if (dst.writable) {
      self.data((chunk, next) => {
        dst.write(chunk, next);
      });
    }

    return dst;
  }
}
