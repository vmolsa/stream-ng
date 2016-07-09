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
var SimplePromise = (function () {
    function SimplePromise() {
        this._fulfilled = false;
        this._rejected = false;
        this._onresolve = new Array();
        this._onreject = new Array();
    }
    Object.defineProperty(SimplePromise.prototype, "pending", {
        get: function () {
            return (!this._fulfilled && !this._rejected);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimplePromise.prototype, "fulfilled", {
        get: function () {
            return this._fulfilled;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimplePromise.prototype, "rejected", {
        get: function () {
            return this._rejected;
        },
        enumerable: true,
        configurable: true
    });
    SimplePromise.prototype._resolve = function (arg) {
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
    SimplePromise.prototype._reject = function (error) {
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
    SimplePromise.prototype.then = function (onFulfilled, onRejected) {
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
    SimplePromise.prototype.catch = function (onRejected) {
        if (this.pending) {
            if (onRejected) {
                this._onreject.push(onRejected);
            }
        }
        return this;
    };
    return SimplePromise;
}());
exports.SimplePromise = SimplePromise;
var StreamStates;
(function (StreamStates) {
    StreamStates[StreamStates["OPENING"] = 2] = "OPENING";
    StreamStates[StreamStates["RUNNING"] = 4] = "RUNNING";
    StreamStates[StreamStates["CLOSING"] = 8] = "CLOSING";
    StreamStates[StreamStates["CLOSED"] = 16] = "CLOSED";
})(StreamStates || (StreamStates = {}));
var StreamNg = (function (_super) {
    __extends(StreamNg, _super);
    function StreamNg(options) {
        _super.call(this);
        this._maxThresholdSize = 16384;
        this._threshold = 0;
        this._objectMode = false;
        this._state = StreamStates.RUNNING;
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
    Object.defineProperty(StreamNg.prototype, "readable", {
        get: function () {
            return (this._ondata.length && this._state & (StreamStates.OPENING | StreamStates.RUNNING | StreamStates.CLOSING)) ? true : false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StreamNg.prototype, "writable", {
        get: function () {
            return (this._write && this._state & (StreamStates.OPENING | StreamStates.RUNNING | StreamStates.CLOSING)) ? true : false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StreamNg.prototype, "isOpening", {
        get: function () {
            return this._state === StreamStates.OPENING;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StreamNg.prototype, "isRunning", {
        get: function () {
            return this._state === StreamStates.RUNNING;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StreamNg.prototype, "isClosing", {
        get: function () {
            return this._state === StreamStates.CLOSING;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StreamNg.prototype, "isClosed", {
        get: function () {
            return this._state === StreamStates.CLOSED;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StreamNg.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    StreamNg.prototype.setState = function (state) {
        var self = this;
        if (state & StreamStates.OPENING && self._state & StreamStates.CLOSED) {
            self._state = StreamStates.OPENING;
        }
        else if (state & StreamStates.RUNNING && self._state & StreamStates.OPENING) {
            self._state = StreamStates.RUNNING;
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
        else if (state & StreamStates.CLOSING && self._state & (StreamStates.OPENING | StreamStates.RUNNING)) {
            self._state = StreamStates.CLOSING;
        }
        else if (state & StreamStates.CLOSED && self._state & ~(StreamStates.CLOSED)) {
            self._state = StreamStates.CLOSED;
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
    StreamNg.prototype.open = function (callback) {
        if (this._state & StreamStates.OPENING) {
            this._onopen.push(callback);
        }
        else {
            if (this._state & (StreamStates.RUNNING | StreamStates.CLOSING)) {
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
    StreamNg.prototype.close = function (callback) {
        if (this._state & (StreamStates.OPENING | StreamStates.RUNNING | StreamStates.CLOSING)) {
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
    StreamNg.prototype.pause = function (callback) {
        this._onpause.push(callback);
        return this;
    };
    StreamNg.prototype.resume = function (callback) {
        this._onresume.push(callback);
        return this;
    };
    StreamNg.prototype.drain = function (callback) {
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
    StreamNg.prototype.data = function (callback) {
        this._ondata.push(callback);
        return this;
    };
    StreamNg.prototype.end = function (arg) {
        var self = this;
        if (arg instanceof Error) {
            self.setState(StreamStates.CLOSED);
            self._reject(arg);
        }
        else if (arg && arg.then && arg.catch) {
            arg.then(function (reply) {
                self.end(reply);
            }, function (error) {
                self.end(error);
            });
        }
        else if (self._state & (StreamStates.RUNNING | StreamStates.CLOSING)) {
            self.setState(StreamStates.CLOSING);
            self.drain(function () {
                self.setState(StreamStates.CLOSED);
                self._resolve(arg);
            });
        }
        else if (self._state & StreamStates.OPENING) {
            self.open(function () {
                self.setState(StreamStates.CLOSING);
                self.drain(function () {
                    self.setState(StreamStates.CLOSED);
                    self._resolve(arg);
                });
            });
        }
        else {
            self._resolve(arg);
        }
        return self;
    };
    StreamNg.prototype.dispatchQueue = function () {
        var self = this;
        if (self._state & (StreamStates.RUNNING | StreamStates.CLOSING)) {
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
                if (self._state & (StreamStates.RUNNING | StreamStates.CLOSING)) {
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
    StreamNg.prototype.write = function (chunk, callback) {
        var self = this;
        if (self.writable) {
            if (!self._objectMode) {
                if (!(chunk instanceof ArrayBuffer) && !ArrayBuffer.isView(chunk)) {
                    if (callback) {
                        try {
                            callback(new TypeError('Invalid chunk. TypedArray / ArrayBuffer Supported.'));
                        }
                        catch (error) {
                            self.end(error);
                        }
                    }
                    else {
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
            if (self._data.length) {
                self._data.unshift(data);
            }
            else {
                self._data.unshift(data);
                if (self._state & (StreamStates.RUNNING | StreamStates.CLOSING)) {
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
    StreamNg.prototype.push = function (chunk, callback) {
        var self = this;
        var afterPush = once(function (error) {
            if (callback) {
                return callback.call(self, error);
            }
            if (error) {
                self.end(error);
            }
        }, self);
        if (!(chunk instanceof ArrayBuffer) && !ArrayBuffer.isView(chunk) && !self._objectMode) {
            afterPush(new TypeError('Invalid chunk. TypedArray / ArrayBuffer Supported.'));
            return self;
        }
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
    StreamNg.prototype.pair = function (dst, options) {
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
                        self.setState(StreamStates.RUNNING);
                    }).close(function () {
                        self.setState(StreamStates.CLOSED);
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
                    else if (self._state & StreamStates.OPENING) {
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
    return StreamNg;
}(SimplePromise));
exports.StreamNg = StreamNg;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StreamNg;
//# sourceMappingURL=stream-ng.js.map