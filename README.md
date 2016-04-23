# Stream-NG
Next generation of Stream API for NodeJS

### Table of Contents
  
- [Class: Stream](#Stream)
  - [Enum: stateType](#Stream_stateType)
  - [Property: state](#Stream_state)
  - [Property: readable](#Stream_readable)
  - [Property: writable](#Stream_writable)
  - [Property: isOpening](#Stream_isOpening)
  - [Property: isRunning](#Stream_isRunning)
  - [Property: isClosing](#Stream_isClosing)
  - [Property: isClosed](#Stream_isClosed)
  - [Method: setState(stateType)](#Stream_setState)
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
  - [Static: once(callback[, this)](#Stream___once)
  - [Static: delay(callback[, arg]](#Stream___delay)
  - [Static: random()](#Stream___random)
  - [Static: sll_add(list, arg)](#Stream___sll_add)
  - [Static: sll_forEach(list, callback)](#Stream___sll_forEach)

### <a name="Stream">Stream</a>

#### <a name="Stream_stateType">Stream.stateType</a>

- Stream.OPENING 
- Stream.RUNNING
- Stream.CLOSING
- Stream.CLOSED

#### <a name="Stream_state">Stream.state</a>

Returns current state of stream

#### <a name="Stream_readable">Stream.readable</a>

A Boolean indicating whether or not the Stream is readable.

#### <a name="Stream_writable">Stream.writable</a>

A Boolean indicating whether or not the Stream is writable.

#### <a name="Stream_isOpening">Stream.isOpening</a>

A Boolean indicating whether or not the Stream is opening.

#### <a name="Stream_isRunning">Stream.isRunning</a>

A Boolean indicating whether or not the Stream is running.

#### <a name="Stream_isClosing">Stream.isClosing</a>

A Boolean indicating whether or not the Stream is closing.

#### <a name="Stream_isClosed">Stream.isClosed</a>

A Boolean indicating whether or not the Stream is closed.

#### <a name="Stream_setState">Stream.setState(stateType)</a>

Change the current state of Stream. Argument must be one of the [stateType](#Stream_stateType)

- Returns [Stream](#Stream)

#### <a name="Stream_close">Stream.close(callback)</a>

Add listener for close event.

- Returns [Stream](#Stream)

#### <a name="Stream_open">Stream.open(callback)</a>

Add listener for open event.

- Returns [Stream](#Stream)

#### <a name="Stream_data">Stream.data(callback)</a>

Add listener for data event.

- Returns [Stream](#Stream)

#### <a name="Stream_drain">Stream.drain(callback)</a>

Add listener for drain event. 
After drain is called. The listener is removed from future events so it must be added again. 

- Returns [Stream](#Stream)

#### <a name="Stream_resume">Stream.resume(callback)</a>

Add listener for Resume event.
Resume is called once when current threshold is dropping below of Stream.maxThresholdSize value.

- Returns [Stream](#Stream)

#### <a name="Stream_pause">Stream.pause(callback)</a>

Add listener for pause event. Pause is called once when current threshold is more than Stream.maxThresholdSize value.

- Returns [Stream](#Stream)

#### <a name="Stream_end">Stream.end(arg)</a>

If argument is Error then this promise is rejected. 
Otherwise end is waiting for drain event and after drain this Promise is resolved with argument.

- Returns [Stream](#Stream)

#### <a name="Stream_write">Stream.write(chunk[, callback])</a>

#### <a name="Stream_push">Stream.push(chunk[, callback])</a>

#### <a name="Stream_pair">Stream.pair(Stream|Node Stream|Promise[, options])</a>

### <a name="Stream_Promise">Stream.Promise</a>

#### <a name="Stream_Promise_then">Stream.Promise.then(onFulfilled, onRejected)</a>

#### <a name="Stream_Promise_catch">Stream.Promise.catch(onRejected)</a>

#### <a name="Stream_Promise_finally">Stream.Promise.finally(onResolved)</a>

#### <a name="Stream_Promise_all">Stream.Promise.all(iterable)</a>

#### <a name="Stream_Promise_forEach">Stream.Promise.forEach(iterable, callback)</a>

### <a name="Stream__">Stream._</a>

#### <a name="Stream___isArray">Stream._.isArray</a>

#### <a name="Stream___isObject">Stream._.isObject</a>

#### <a name="Stream___isString">Stream._.isString</a>

#### <a name="Stream___isUndefined">Stream._.isUndefined</a>

#### <a name="Stream___isFunction">Stream._.isFunction</a>

#### <a name="Stream___isNumber">Stream._.isNumber</a>

#### <a name="Stream___isTypedArray">Stream._.isTypedArray</a>

#### <a name="Stream___isArrayBuffer">Stream._.isArrayBuffer</a>

#### <a name="Stream___isError">Stream._.isError</a>

#### <a name="Stream___isPromise">Stream._.isPromise</a>

#### <a name="Stream___size">Stream._.size</a>

#### <a name="Stream___now">Stream._.now</a>

#### <a name="Stream___extend">Stream._.extend</a>

#### <a name="Stream___forEach">Stream._.forEach</a>

#### <a name="Stream___once">Stream._.once</a>

#### <a name="Stream___delay">Stream._.delay</a>

#### <a name="Stream___random">Stream._.random</a>

#### <a name="Stream___sll_add">Stream._.sll_add</a>

#### <a name="Stream___sll_forEach">Stream._.sll_forEach</a>


