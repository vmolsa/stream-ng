export declare type TypedArray = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array | Uint8ClampedArray;
export declare type onResolve = (arg: any) => void;
export declare type onReject = (error: any) => void;
export declare type notifyCallback = () => void;
export declare type errorCallback = (error?: Error) => void;
export declare type dataCallback = (chunk: TypedArray, next: errorCallback) => void;
export declare class Promise {
    private _fulfilled;
    private _rejected;
    private _onresolve;
    private _onreject;
    pending: boolean;
    fulfilled: boolean;
    rejected: boolean;
    protected _resolve(arg: any): Promise;
    protected _reject(error: any): Promise;
    then(onFulfilled: onResolve, onRejected?: onReject): Promise;
    catch(onRejected: onReject): Promise;
}
export declare enum State {
    OPENING = 2,
    RUNNING = 4,
    CLOSING = 8,
    CLOSED = 16,
}
export interface Options {
    maxThresholdSize?: number;
    objectMode?: boolean;
    state?: State;
    write?: dataCallback;
}
export interface Data {
    chunk: TypedArray;
    callback?: errorCallback;
}
export declare class Stream extends Promise {
    private _maxThresholdSize;
    private _threshold;
    private _objectMode;
    private _state;
    private _onopen;
    private _onclose;
    private _ondata;
    private _ondrain;
    private _onresume;
    private _onpause;
    private _data;
    private _waiting;
    protected _write: dataCallback;
    constructor(options?: Options);
    readable: boolean;
    writable: boolean;
    isOpening: boolean;
    isRunning: boolean;
    isClosing: boolean;
    isClosed: boolean;
    state: State;
    setState(state: State): Stream;
    open(callback: notifyCallback): Stream;
    close(callback: notifyCallback): Stream;
    pause(callback: notifyCallback): Stream;
    resume(callback: notifyCallback): Stream;
    drain(callback: notifyCallback): Stream;
    data(callback: dataCallback): Stream;
    end(arg?: any): Stream;
    private dispatchQueue();
    write(chunk: TypedArray, callback?: errorCallback): Stream;
    push(chunk: TypedArray, callback?: errorCallback): Stream;
    pair(dst: any, options: any): Stream;
}
