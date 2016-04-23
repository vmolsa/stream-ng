# Stream-NG

Next generation of Stream API for NodeJS

### Table of Contents
  
- [Class: Stream](#Stream)
  - [Enum: status](#Stream_status)
  - [Property: state](#Stream_state)
  - [Property: readable](#Stream_readable)
  - [Property: writable](#Stream_writable)
  - [Property: isOpening](#Stream_isOpening)
  - [Property: isRunning](#Stream_isRunning)
  - [Property: isClosing](#Stream_isClosing)
  - [Property: isClosed](#Stream_isClosed)
  - [Method: setState(status)](#Stream_setState)
  - [Method: close(callback)](#Stream_close)
  - [Method: open(callback)](#Stream_open)
  - [Method: data(callback)](#Stream_data)
  - [Method: drain(callback)](#Stream_drain)
  - [Method: resume(callback)](#Stream_resume)
  - [Method: pause(callback)](#Stream_pause)
  - [Method: end(arg)](#Stream_end)
  - [Method: write(chunk[, callback])](#Stream_write)
  - [Method: push(chunk[, callback])](#Stream_push)
  - [Method: pair(Stream|Node Stream|Promise[, options])](#Stream_pair)
  - [Class: Promise](#Stream_Promise)
  - [Object: _](#Stream__)
- [Class: Promise](#Stream_Promise)
  - [Method: then(onFulfilled, onRejected)](#Stream_Promise_then)
  - [Method: catch(onRejected)](#Stream_Promise_catch)
  - [Method: finally(onResolved)](#Stream_Promise_finally)
  - [Static: all(iterable)](#Stream_Promise_all)
  - [Static: forEach(iterable, callback)](#Stream_Promise_forEach)
- [Object: _](#Stream__)
  - [Static: isArray(arg)](#Stream___isArray)
  - [Static: isObject(arg)](#Stream___isObject)
  - [Static: isString(arg)](#Stream___isString)
  - [Static: isUndefined(arg)](#Stream___isUndefined)
  - [Static: isFunction(arg)](#Stream___isFunction)
  - [Static: isNumber(arg)](#Stream___isNumber)
  - [Static: isTypedArray(arg)](#Stream___isTypedArray)
  - [Static: isArrayBuffer(arg)](#Stream___isArrayBuffer)
  - [Static: isError(arg)](#Stream___isError)
  - [Static: isPromise(arg)](#Stream___isPromise)
  - [Static: size(arg)](#Stream___size)
  - [Static: now()](#Stream___now)
  - [Static: extend(dst, src)](#Stream___extend)
  - [Static: forEach(collection, callback)](#Stream___forEach)
  - [Static: once(callback[, this])](#Stream___once)
  - [Static: delay(callback[, arg])](#Stream___delay)
  - [Static: random()](#Stream___random)
  - [Static: sll_add(collection, arg)](#Stream___sll_add)
  - [Static: sll_forEach(collection, callback)](#Stream___sll_forEach)

### <a name="Stream">Stream</a>

#### <a name="Stream_status">Stream.status</a>

- Stream.OPENING 
- Stream.RUNNING
- Stream.CLOSING
- Stream.CLOSED

#### <a name="Stream_state">Stream.state</a>

Returns current state of stream.

- Returns [Stream.status](#Stream_status)

#### <a name="Stream_readable">Stream.readable</a>

A Boolean indicating whether or not the Stream is readable.
See [Stream.data](#Stream_data).

- Returns Boolean

#### <a name="Stream_writable">Stream.writable</a>

A Boolean indicating whether or not the Stream is writable.
See [Stream](#Stream).

- Returns Boolean

#### <a name="Stream_isOpening">Stream.isOpening</a>

A Boolean indicating whether or not the Stream is opening.

- Returns Boolean

#### <a name="Stream_isRunning">Stream.isRunning</a>

A Boolean indicating whether or not the Stream is running.

- Returns Boolean

#### <a name="Stream_isClosing">Stream.isClosing</a>

A Boolean indicating whether or not the Stream is closing.

- Returns Boolean

#### <a name="Stream_isClosed">Stream.isClosed</a>

A Boolean indicating whether or not the Stream is closed.

- Returns Boolean

#### <a name="Stream_setState">Stream.setState(status)</a>

Change the current state of Stream. Argument must be one of the [Stream.status](#Stream_status)

- Returns [Stream](#Stream)

#### <a name="Stream_close">Stream.close(callback)</a>

If [Stream.state](#Stream_state) is not [Stream.CLOSED](#Stream_status) callback is added to list to wait for [Stream.CLOSED](#Stream_status).
Otherwise callback is invoked immediately.

- Returns [Stream](#Stream)

#### <a name="Stream_open">Stream.open(callback)</a>

If [Stream.state](#Stream_state) is [Stream.OPENING](#Stream_status) callback is added to list to wait for [Stream.RUNNING](#Stream_status). 
If [Stream.state](#Stream_state) is [Stream.RUNNING](#Stream_status) or [Stream.CLOSING](#Stream_status) then callback is called immediately.
Otherwise callback is ignored.

- Returns [Stream](#Stream)

#### <a name="Stream_data">Stream.data(callback)</a>

Enables [Stream.readable](#Stream_readable) mode.
Callback is invoked when [Stream.push](#Stream_push) is called.

- Returns [Stream](#Stream)

#### <a name="Stream_drain">Stream.drain(callback)</a>

After drain is invoked. The callback is removed from future callbacks so it must be added again to reuse the callback. 

- Returns [Stream](#Stream)

#### <a name="Stream_resume">Stream.resume(callback)</a>

Resume is invoked once when current threshold is dropping below of [Stream.maxThresholdSize](#Stream) value.

- Returns [Stream](#Stream)

#### <a name="Stream_pause">Stream.pause(callback)</a>

Pause is invoked once when current threshold is more than [Stream.maxThresholdSize](#Stream) value.

- Returns [Stream](#Stream)

#### <a name="Stream_end">Stream.end(arg)</a>

If argument is Error then this promise is rejected. 
Otherwise end is waiting for drain event and after drain this Promise is resolved with argument.

- Returns [Stream](#Stream)

#### <a name="Stream_write">Stream.write(chunk[, callback])</a>

Adds chunk to write queue.
If Stream is not in objectMode then chunk must be ArrayBuffer or TypedArray.
If [Stream is writable](#Stream_writable) [Stream._write](#Stream) is invoked. 
If error is occurred on write() then Stream is rejected with that error except on when callback function is defined.

- Returns [Stream](#Stream)

#### <a name="Stream_push">Stream.push(chunk[, callback])</a>

If [Stream is readable](#Stream_readable) then [Stream.data()](#Stream_data) callbacks are invoked. 
If Stream is not in objectMode then chunk must be ArrayBuffer or TypedArray.
If error is occurred on push() then Stream is rejected with that error except on when callback function is defined.

- Returns [Stream](#Stream)

#### <a name="Stream_pair">Stream.pair(Stream|Node Stream|Promise[, options])</a>

Same as [Pipe](https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options) but connects stream to both ways.

```js
var socket1 = new Socket();
var socket2 = new Socket();

socket1.pair(socket2);
```

```js
var socket1 = new Socket();
var socket2 = new Socket();

socket1.pipe(socket2).pipe(socket1);
```

- Returns [Stream](#Stream)

### <a name="Stream_Promise">Stream.Promise</a>

The Promise object is used for deferred and asynchronous computations. 
A Promise represents an operation that hasn't completed yet, but is expected in the future.

```js
new Promise(function(resolve, reject) {});
```

#### <a name="Stream_Promise_then">Stream.Promise.then(onFulfilled, onRejected)</a>

The then() method returns a Promise. 
It takes two arguments: callback functions for the success and failure cases of the Promise.

- Returns [Stream.Promise](#Stream_Promise)

#### <a name="Stream_Promise_catch">Stream.Promise.catch(onRejected)</a>

The catch() method returns a Promise and deals with rejected cases only. 
It behaves the same as calling Promise.then(undefined, onRejected).

- Returns [Stream.Promise](#Stream_Promise)

#### <a name="Stream_Promise_finally">Stream.Promise.finally(onResolved)</a>

Allows you to observe either the fulfillment or rejection of a promise, but to do so without modifying the final value.
This is useful to release resources or do some clean-up that needs to be done whether the promise was rejected or resolved.

- Returns [Stream.Promise](#Stream_Promise)

#### <a name="Stream_Promise_all">Stream.Promise.all(iterable)</a>

- Returns [Stream.Promise](#Stream_Promise)

#### <a name="Stream_Promise_forEach">Stream.Promise.forEach(iterable, callback)</a>

- Returns [Stream.Promise](#Stream_Promise)

### <a name="Stream__">Stream._</a>

Basic underscore library.

- Returns Object

#### <a name="Stream___isArray">Stream._.isArray(arg)</a>

A Boolean indicating whether or not the argument is Array.

- Returns Boolean

#### <a name="Stream___isObject">Stream._.isObject(arg)</a>

A Boolean indicating whether or not the argument is Object.

- Returns Boolean

#### <a name="Stream___isString">Stream._.isString(arg)</a>

A Boolean indicating whether or not the argument is String.

- Returns Boolean

#### <a name="Stream___isUndefined">Stream._.isUndefined(arg)</a>

A Boolean indicating whether or not the argument is Undefined.

- Returns Boolean

#### <a name="Stream___isFunction">Stream._.isFunction(arg)</a>

A Boolean indicating whether or not the argument is Function.

- Returns Boolean

#### <a name="Stream___isNumber">Stream._.isNumber(arg)</a>

A Boolean indicating whether or not the argument is Number.

- Returns Boolean

#### <a name="Stream___isTypedArray">Stream._.isTypedArray(arg)</a>

A Boolean indicating whether or not the argument is TypedArray.

- Returns Boolean

#### <a name="Stream___isArrayBuffer">Stream._.isArrayBuffer(arg)</a>

A Boolean indicating whether or not the argument is ArrayBuffer.

- Returns Boolean

#### <a name="Stream___isError">Stream._.isError(arg)</a>

A Boolean indicating whether or not the argument is Error.

- Returns Boolean

#### <a name="Stream___isPromise">Stream._.isPromise(arg)</a>

A Boolean indicating whether or not the argument is Promise-like.

- Returns Boolean

#### <a name="Stream___size">Stream._.size(collection)</a>

Gets the size of collection by returning its length for array-like values or the number of own enumerable string keyed properties for objects.

- Returns the collection size.

#### <a name="Stream___now">Stream._.now()</a>

Gets the timestamp of the number of milliseconds that have elapsed since the Unix epoch (1 January 1970 00:00:00 UTC).

- Returns the timestamp.

#### <a name="Stream___extend">Stream._.extend(dst, src)</a>

Expand the object with another object.

- Returns Object

#### <a name="Stream___forEach">Stream._.forEach(collection, callback)</a>

Iterates over elements of collection and invokes callback for each element. The iteratee is invoked with arguments: (value, index|key).

- Returns collection

#### <a name="Stream___once">Stream._.once(callback, self)</a>

Creates new function that invokes callback only once.

- Returns Function

#### <a name="Stream___delay">Stream._.delay(callback[, arg])</a>

Once the current event loop turn runs to completion, the callback function is invoked.

#### <a name="Stream___random">Stream._.random()</a>

Creates random number.

- Returns number

#### <a name="Stream___sll_add">Stream._.sll_add(collection, arg)</a>

Add Element to Singly Linked List.

- Returns collection

#### <a name="Stream___sll_forEach">Stream._.sll_forEach(collection, callback)</a>

Method executes a provided callback once per collection element.

- Returns collection

