# Stream-NG
Next generation of Stream API for NodeJS

### Table of Contents
  
- [Class: Stream](#Stream)
  - [Enum: OPENING](#Stream_OPENING)
  - [Enum: RUNNING](#Stream_RUNNING)
  - [Enum: CLOSING](#Stream_CLOSING)
  - [Enum: CLOSED](#Stream_CLOSED)
  - [Property: state](#Stream_state)
  - [Property: readable](#Stream_readable)
  - [Property: writable](#Stream_writable)
  - [Property: isOpening](#Stream_isOpening)
  - [Property: isRunning](#Stream_isRunning)
  - [Property: isClosing](#Stream_isClosing)
  - [Property: isClosed](#Stream_isClosed)
  - [Method: setState](#Stream_setState)
  - [Method: close](#Stream_close)
  - [Method: open](#Stream_open)
  - [Method: data](#Stream_data)
  - [Method: drain](#Stream_drain)
  - [Method: resume](#Stream_resume)
  - [Method: pause](#Stream_pause)
  - [Method: end](#Stream_end)
  - [Method: write](#Stream_write)
  - [Method: push](#Stream_push)
  - [Method: pair](#Stream_pair)
  - [Class: Promise](#Stream_Promise)
  - [Object: _](#Stream__)
- [Class: Promise](#Stream_Promise)
  - [Method: then](#Stream_Promise_then)
  - [Method: catch](#Stream_Promise_catch)
  - [Method: finally](#Stream_Promise_finally)
  - [Static: all](#Stream_Promise_all)
  - [Static: forEach](#Stream_Promise_forEach)
- [Object: _](#Stream__)
  - [Static: isArray](#Stream___isArray)
  - [Static: isObject](#Stream___isObject)
  - [Static: isString](#Stream___isString)
  - [Static: isUndefined](#Stream___isUndefined)
  - [Static: isFunction](#Stream___isFunction)
  - [Static: isNumber](#Stream___isNumber)
  - [Static: isTypedArray](#Stream___isTypedArray)
  - [Static: isArrayBuffer](#Stream___isArrayBuffer)
  - [Static: isError](#Stream___isError)
  - [Static: isPromise](#Stream___isPromise)
  - [Static: size](#Stream___size)
  - [Static: now](#Stream___now)
  - [Static: extend](#Stream___extend)
  - [Static: forEach](#Stream___forEach)
  - [Static: once](#Stream___once)
  - [Static: delay](#Stream___delay)
  - [Static: random](#Stream___random)
  - [Static: sll_add](#Stream___sll_add)
  - [Static: sll_forEach](#Stream___sll_forEach)

### <a name="Stream">Stream</a>

#### <a name="Stream_OPENING">Stream.OPENING</a>

#### <a name="Stream_RUNNING">Stream.RUNNING</a>

#### <a name="Stream_CLOSING">Stream.CLOSING</a>

#### <a name="Stream_CLOSED">Stream.CLOSED</a>

#### <a name="Stream_state">Stream.state</a>

#### <a name="Stream_readable">Stream.readable</a>

#### <a name="Stream_writable">Stream.writable</a>

#### <a name="Stream_isOpening">Stream.isOpening</a>

#### <a name="Stream_isRunning">Stream.isRunning</a>

#### <a name="Stream_isClosing">Stream.isClosing</a>

#### <a name="Stream_isClosed">Stream.isClosed</a>

#### <a name="Stream_setState">Stream.setState</a>

#### <a name="Stream_close">Stream.close</a>

#### <a name="Stream_open">Stream.open</a>

#### <a name="Stream_data">Stream.data</a>

#### <a name="Stream_drain">Stream.drain</a>

#### <a name="Stream_resume">Stream.resume</a>

#### <a name="Stream_pause">Stream.pause</a>

#### <a name="Stream_end">Stream.end</a>

#### <a name="Stream_write">Stream.write</a>

#### <a name="Stream_push">Stream.push</a>

#### <a name="Stream_pair">Stream.pair</a>

### <a name="Stream_Promise">Stream.Promise</a>

#### <a name="Stream_Promise_then">Stream.Promise.then</a>

#### <a name="Stream_Promise_catch">Stream.Promise.catch</a>

#### <a name="Stream_Promise_finally">Stream.Promise.finally</a>

#### <a name="Stream_Promise_all">Stream.Promise.all</a>

#### <a name="Stream_Promise_forEach">Stream.Promise.forEach</a>

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


