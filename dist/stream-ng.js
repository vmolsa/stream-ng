/*
 * Stream-NG - Next generation of Stream interface for NodeJS
 *
 * Copyright (c) 2016 vmolsa <ville.molsa@gmail.com> (http://github.com/vmolsa)
 * MIT License <https://github.com/vmolsa/stream-ng/blob/master/LICENSE>
 *
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var global = this;
function once(callback, self) {
    return (...restOfArgs) => {
        if (callback) {
            callback.apply(self || this, restOfArgs);
        }
        callback = undefined;
    };
}
exports.once = once;
function isTypedArray(arg) {
    return (arg instanceof ArrayBuffer || ArrayBuffer.isView(arg));
}
exports.isTypedArray = isTypedArray;
var State;
(function (State) {
    State[State["OPENING"] = 2] = "OPENING";
    State[State["RUNNING"] = 4] = "RUNNING";
    State[State["CLOSING"] = 8] = "CLOSING";
    State[State["CLOSED"] = 16] = "CLOSED";
})(State = exports.State || (exports.State = {}));
class Stream {
    constructor(options) {
        this._maxThresholdSize = 16384;
        this._threshold = 0;
        this._objectMode = false;
        this._state = State.RUNNING;
        this._onopen = new Array();
        this._onclose = new Array();
        this._ondata = new Array();
        this._ondrain = new Array();
        this._onresume = new Array();
        this._onpause = new Array();
        this._data = new Array();
        this._waiting = false;
        this._end = undefined;
        let end = undefined;
        let promise = new Promise((resolve, reject) => {
            end = (self, arg) => {
                if (arg instanceof Error) {
                    self.setState(State.CLOSED);
                    reject(arg);
                }
                else if (arg && arg.then && arg.catch) {
                    arg.then((reply) => {
                        self.end(reply);
                    }, (error) => {
                        self.end(error);
                    });
                }
                else if (self._state & (State.RUNNING | State.CLOSING)) {
                    self.setState(State.CLOSING);
                    self.drain(() => {
                        self.setState(State.CLOSED);
                        resolve(arg);
                    });
                }
                else if (self._state & State.OPENING) {
                    self.open(() => {
                        self.setState(State.CLOSING);
                        self.drain(() => {
                            self.setState(State.CLOSED);
                            resolve(arg);
                        });
                    });
                }
                else {
                    self.setState(State.CLOSED);
                    resolve(arg);
                }
            };
        });
        this._end = end;
        this._promise = promise;
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
    then(resolve, reject) {
        this._promise.then(resolve, reject);
        return this;
    }
    catch(reject) {
        this._promise.catch(reject);
        return this;
    }
    finally(callback) {
        this._promise.then(() => {
            callback();
        }, () => {
            callback();
        });
        return this;
    }
    get readable() {
        return (this._ondata.length && this._state & (State.OPENING | State.RUNNING | State.CLOSING)) ? true : false;
    }
    get writable() {
        return (this._write && this._state & (State.OPENING | State.RUNNING | State.CLOSING)) ? true : false;
    }
    get isOpening() {
        return this._state === State.OPENING;
    }
    get isRunning() {
        return this._state === State.RUNNING;
    }
    get isClosing() {
        return this._state === State.CLOSING;
    }
    get isClosed() {
        return this._state === State.CLOSED;
    }
    get state() {
        return this._state;
    }
    setState(state) {
        var self = this;
        if (state & State.OPENING && self._state & State.CLOSED) {
            self._state = State.OPENING;
        }
        else if (state & State.RUNNING && self._state & State.OPENING) {
            self._state = State.RUNNING;
            self._onopen.forEach((callback) => {
                try {
                    callback.call(self);
                }
                catch (error) {
                    self.end(error);
                }
            });
            self._onopen = new Array();
        }
        else if (state & State.CLOSING && self._state & (State.OPENING | State.RUNNING)) {
            self._state = State.CLOSING;
        }
        else if (state & State.CLOSED && self._state & ~(State.CLOSED)) {
            self._state = State.CLOSED;
            self._onclose.forEach((callback) => {
                try {
                    callback.call(self);
                }
                catch (error) {
                    self.end(error);
                }
            });
            self._onclose = new Array();
        }
        return self;
    }
    open(callback) {
        if (this._state & State.OPENING) {
            this._onopen.push(callback);
        }
        else {
            if (this._state & (State.RUNNING | State.CLOSING)) {
                try {
                    callback.call(this);
                }
                catch (error) {
                    this.end(error);
                }
            }
        }
        return this;
    }
    close(callback) {
        if (this._state & (State.OPENING | State.RUNNING | State.CLOSING)) {
            this._onclose.push(callback);
        }
        else {
            try {
                callback.call(this);
            }
            catch (error) {
                this.end(error);
            }
        }
        return this;
    }
    pause(callback) {
        this._onpause.push(callback);
        return this;
    }
    resume(callback) {
        this._onresume.push(callback);
        return this;
    }
    drain(callback) {
        setImmediate((self, callback) => {
            if (self.writable) {
                if (self._data.length) {
                    this._ondrain.push(callback);
                }
                else {
                    try {
                        callback.call(self);
                    }
                    catch (error) {
                        self.end(error);
                    }
                }
            }
            else {
                try {
                    callback.call(self);
                }
                catch (error) {
                    self.end(error);
                }
            }
        }, this, callback);
        return this;
    }
    data(callback) {
        this._ondata.push(callback);
        return this;
    }
    end(arg) {
        this._end(this, arg);
        return this;
    }
    dispatchQueue() {
        var self = this;
        if (self._state & (State.RUNNING | State.CLOSING)) {
            if (self._data.length) {
                var data = self._data.pop();
                var afterWrite = once((error) => {
                    if (data.callback) {
                        try {
                            data.callback(error);
                        }
                        catch (error) {
                            return self.end(error);
                        }
                    }
                    else if (error) {
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
                                }
                                catch (error) {
                                    self.end(error);
                                }
                            });
                        }
                    }
                    self._data.length ? self.dispatchQueue() : setImmediate((self) => {
                        self.dispatchQueue();
                    }, self);
                }, self);
                try {
                    return self._write.call(self, data.chunk, afterWrite);
                }
                catch (error) {
                    return self.end(error);
                }
            }
            else {
                if (self._state & (State.RUNNING | State.CLOSING)) {
                    self._ondrain.forEach((onDrain) => {
                        try {
                            onDrain.call(self);
                        }
                        catch (error) {
                            self.end(error);
                        }
                    });
                    self._ondrain = new Array();
                }
            }
        }
        return self;
    }
    write(chunk, callback) {
        var self = this;
        if (self.writable) {
            if (!self._objectMode) {
                if (!isTypedArray(chunk)) {
                    if (callback) {
                        callback(new Error('ObjectMode disabled'));
                        return self;
                    }
                    else {
                        return self.end(new Error('ObjectMode disabled'));
                    }
                }
                chunk = new Uint8Array(chunk);
            }
            var data = {
                chunk: chunk,
                callback: callback,
            };
            if (self._data.length) {
                self._data.unshift(data);
            }
            else {
                self._data.unshift(data);
                if (self._state & (State.RUNNING | State.CLOSING)) {
                    setImmediate((self) => {
                        self.dispatchQueue();
                    }, self);
                }
                else {
                    self.open(() => {
                        setImmediate((self) => {
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
                        }
                        catch (error) {
                            self.end(error);
                        }
                    });
                }
            }
        }
        else {
            if (callback) {
                try {
                    callback(new Error('Stream is not writable.'));
                }
                catch (error) {
                    self.end(error);
                }
            }
            else {
                self.end(new Error('Stream is not writable.'));
            }
        }
        return self;
    }
    push(chunk, callback) {
        var self = this;
        if (self._objectMode && !isTypedArray(chunk)) {
            if (callback) {
                callback(new Error('ObjectMode disabled'));
                return self;
            }
            else {
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
                }
                catch (error) {
                    afterPush(error);
                }
            });
        }
        else {
            afterPush(new Error('Stream is not readable.'));
        }
        return self;
    }
    pipe(dst) {
        var self = this;
        dst.then((arg) => {
            self.end(arg);
        }).catch((error) => {
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
exports.Stream = Stream;
//# sourceMappingURL=stream-ng.js.map