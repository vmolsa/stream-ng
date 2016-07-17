/*
 * Stream-NG - Next generation of Stream interface for NodeJS
 *
 * Copyright (c) 2016 vmolsa <ville.molsa@gmail.com> (http://github.com/vmolsa)
 * MIT License <https://github.com/vmolsa/stream-ng/blob/master/LICENSE>
 *
 */
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var global = this;
function once(callback, self) {
    var _this = this;
    return function () {
        var restOfArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            restOfArgs[_i - 0] = arguments[_i];
        }
        if (callback) {
            callback.apply(self || _this, restOfArgs);
        }
        callback = undefined;
    };
}
var Promise = (function () {
    function Promise() {
        this._fulfilled = false;
        this._rejected = false;
        this._onresolve = new Array();
        this._onreject = new Array();
    }
    Object.defineProperty(Promise.prototype, "pending", {
        get: function () {
            return (!this._fulfilled && !this._rejected);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Promise.prototype, "fulfilled", {
        get: function () {
            return this._fulfilled;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Promise.prototype, "rejected", {
        get: function () {
            return this._rejected;
        },
        enumerable: true,
        configurable: true
    });
    Promise.prototype._resolve = function (arg) {
        setImmediate(function (self, arg) {
            if (self.pending) {
                self._fulfilled = true;
                self._onresolve.forEach(function (callback) {
                    callback.call(self, arg);
                });
            }
        }, this, arg);
        return this;
    };
    Promise.prototype._reject = function (error) {
        setImmediate(function (self, error) {
            if (self.pending) {
                self._rejected = true;
                self._onreject.forEach(function (callback) {
                    callback.call(self, error);
                });
            }
        }, this, error);
        return this;
    };
    Promise.prototype.then = function (onFulfilled, onRejected) {
        if (this.pending) {
            if (onFulfilled) {
                this._onresolve.push(onFulfilled);
            }
            if (onRejected) {
                this._onreject.push(onRejected);
            }
        }
        return this;
    };
    Promise.prototype.catch = function (onRejected) {
        if (this.pending) {
            if (onRejected) {
                this._onreject.push(onRejected);
            }
        }
        return this;
    };
    return Promise;
}());
exports.Promise = Promise;
(function (State) {
    State[State["OPENING"] = 2] = "OPENING";
    State[State["RUNNING"] = 4] = "RUNNING";
    State[State["CLOSING"] = 8] = "CLOSING";
    State[State["CLOSED"] = 16] = "CLOSED";
})(exports.State || (exports.State = {}));
var State = exports.State;
var Stream = (function (_super) {
    __extends(Stream, _super);
    function Stream(options) {
        _super.call(this);
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
    Object.defineProperty(Stream.prototype, "readable", {
        get: function () {
            return (this._ondata.length && this._state & (State.OPENING | State.RUNNING | State.CLOSING)) ? true : false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stream.prototype, "writable", {
        get: function () {
            return (this._write && this._state & (State.OPENING | State.RUNNING | State.CLOSING)) ? true : false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stream.prototype, "isOpening", {
        get: function () {
            return this._state === State.OPENING;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stream.prototype, "isRunning", {
        get: function () {
            return this._state === State.RUNNING;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stream.prototype, "isClosing", {
        get: function () {
            return this._state === State.CLOSING;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stream.prototype, "isClosed", {
        get: function () {
            return this._state === State.CLOSED;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stream.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Stream.prototype.setState = function (state) {
        var self = this;
        if (state & State.OPENING && self._state & State.CLOSED) {
            self._state = State.OPENING;
        }
        else if (state & State.RUNNING && self._state & State.OPENING) {
            self._state = State.RUNNING;
            self._onopen.forEach(function (callback) {
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
            self._onclose.forEach(function (callback) {
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
    };
    Stream.prototype.open = function (callback) {
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
    };
    Stream.prototype.close = function (callback) {
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
    };
    Stream.prototype.pause = function (callback) {
        this._onpause.push(callback);
        return this;
    };
    Stream.prototype.resume = function (callback) {
        this._onresume.push(callback);
        return this;
    };
    Stream.prototype.drain = function (callback) {
        var _this = this;
        setImmediate(function (self, callback) {
            if (self.writable) {
                if (self._data.length) {
                    _this._ondrain.push(callback);
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
        }, this, callback);
        return this;
    };
    Stream.prototype.data = function (callback) {
        this._ondata.push(callback);
        return this;
    };
    Stream.prototype.end = function (arg) {
        var self = this;
        if (arg instanceof Error) {
            self.setState(State.CLOSED);
            self._reject(arg);
        }
        else if (arg && arg.then && arg.catch) {
            arg.then(function (reply) {
                self.end(reply);
            }, function (error) {
                self.end(error);
            });
        }
        else if (self._state & (State.RUNNING | State.CLOSING)) {
            self.setState(State.CLOSING);
            self.drain(function () {
                self.setState(State.CLOSED);
                self._resolve(arg);
            });
        }
        else if (self._state & State.OPENING) {
            self.open(function () {
                self.setState(State.CLOSING);
                self.drain(function () {
                    self.setState(State.CLOSED);
                    self._resolve(arg);
                });
            });
        }
        else {
            self._resolve(arg);
        }
        return self;
    };
    Stream.prototype.dispatchQueue = function () {
        var self = this;
        if (self._state & (State.RUNNING | State.CLOSING)) {
            if (self._data.length) {
                var data = self._data.pop();
                var afterWrite = once(function (error) {
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
                            self._onresume.forEach(function (onResume) {
                                try {
                                    onResume.call(self);
                                }
                                catch (error) {
                                    self.end(error);
                                }
                            });
                        }
                    }
                    self._data.length ? self.dispatchQueue() : setImmediate(function (self) {
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
                    self._ondrain.forEach(function (onDrain) {
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
    };
    Stream.prototype.write = function (chunk, callback) {
        var self = this;
        if (self.writable) {
            if (!self._objectMode) {
                chunk = new Uint8Array(chunk.buffer);
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
                    setImmediate(function (self) {
                        self.dispatchQueue();
                    }, self);
                }
                else {
                    self.open(function () {
                        setImmediate(function (self) {
                            self.dispatchQueue();
                        }, self);
                    });
                }
            }
            if (!self._objectMode) {
                self._threshold += data.chunk.byteLength;
                if ((self._threshold > self._maxThresholdSize) && !self._waiting) {
                    self._waiting = true;
                    self._onpause.forEach(function (onPause) {
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
    };
    Stream.prototype.push = function (chunk, callback) {
        var self = this;
        var afterPush = once(function (error) {
            if (callback) {
                return callback.call(self, error);
            }
            if (error) {
                self.end(error);
            }
        }, self);
        if (self.readable) {
            self._ondata.forEach(function (onData) {
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
    };
    Stream.prototype.pair = function (dst, options) {
        var self = this;
        options = options || {};
        if (dst && dst.then && dst.catch) {
            if (!dst.pending) {
                return self.end(new Error('Stream has been resolved.'));
            }
            if (dst.data && dst.end && dst.write) {
                if (!options.noResolve) {
                    dst.then(function (arg) {
                        self.end(arg);
                    }, function (error) {
                        self.end(error);
                    });
                    self.then(function (arg) {
                        dst.end(arg);
                    }, function (error) {
                        dst.end(error);
                    });
                }
                if (options.checkState && dst.open && dst.close) {
                    dst.open(function () {
                        self.setState(State.RUNNING);
                    }).close(function () {
                        self.setState(State.CLOSED);
                    });
                }
                if (dst.writable) {
                    self.data(function (chunk, next) {
                        dst.write(chunk, next);
                    });
                }
                if (self.writable) {
                    dst.data(function (chunk, next) {
                        self.write(chunk, next);
                    });
                }
            }
            else {
                dst.then(function (arg) {
                    self.end(arg);
                }, function (error) {
                    self.end(error);
                });
            }
        }
        else {
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
                        self.resume(function () {
                            dst.resume();
                        });
                        self.pause(function () {
                            dst.pause();
                        });
                        dst.on('data', onData);
                        dst.on('end', onEnd);
                    }
                }
                function addWritable() {
                    if (dst.writable) {
                        self.data(function (chunk, next) {
                            if (dst.writable) {
                                if (global.Buffer !== 'undefined') {
                                    dst.write(new global.Buffer(chunk), next);
                                }
                                else {
                                    dst.write(chunk, next);
                                }
                            }
                            else {
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
                    }
                    else if (self._state & State.OPENING) {
                        self.open(function () {
                            addReadable();
                        });
                    }
                }
            }
            catch (error) {
                self.end(error);
            }
        }
        return self;
    };
    return Stream;
}(Promise));
exports.Stream = Stream;
//# sourceMappingURL=stream-ng.js.map