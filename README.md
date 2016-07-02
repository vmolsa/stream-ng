# Stream-NG

Next generation of Stream API for NodeJS

### Table of Contents
  
- [Class: Stream](#Stream) extends [Class: Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)
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

### <a name="Stream">Stream</a>

```js
new Stream({
  maxThresholdSize: 16384,
  objectMode: false,
  state: Stream.RUNNING,
  _write: function(chunk, next) {
    // Enables writable mode.
    // send chunk to socket or write chunk to file. 
    // Call next() when the current chunk is consumed or error is occurred: next(error);
    next();
  },
});
```

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