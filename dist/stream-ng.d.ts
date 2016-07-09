export declare type onResolve = (arg: any) => void;
export declare type onReject = (error: any) => void;
export declare type notifyCallback = () => void;
export declare type errorCallback = (error?: Error) => void;
export declare type dataCallback = (chunk: any, next: errorCallback) => void;
export declare class SimplePromise {
    private _fulfilled;
    private _rejected;
    private _onresolve;
    private _onreject;
    pending: boolean;
    fulfilled: boolean;
    rejected: boolean;
    _resolve(arg: any): SimplePromise;
    _reject(error: any): SimplePromise;
    then(onFulfilled: onResolve, onRejected?: onReject): SimplePromise;
    catch(onRejected: onReject): SimplePromise;
}
export declare enum StreamStates {
    OPENING = 2,
    RUNNING = 4,
    CLOSING = 8,
    CLOSED = 16,
}
export interface StreamOptions {
    maxThresholdSize?: number;
    objectMode?: boolean;
    state?: StreamStates;
    write?: dataCallback;
}
export interface StreamData {
    chunk: any;
    callback?: errorCallback;
}
export declare class StreamNg extends SimplePromise {
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
    constructor(options?: StreamOptions);
    readable: boolean;
    writable: boolean;
    isOpening: boolean;
    isRunning: boolean;
    isClosing: boolean;
    isClosed: boolean;
    state: StreamStates;
    setState(state: StreamStates): StreamNg;
    open(callback: notifyCallback): StreamNg;
    close(callback: notifyCallback): StreamNg;
    pause(callback: notifyCallback): StreamNg;
    resume(callback: notifyCallback): StreamNg;
    drain(callback: notifyCallback): StreamNg;
    data(callback: dataCallback): StreamNg;
    end(arg?: any): StreamNg;
    private dispatchQueue();
    write(chunk: any, callback?: errorCallback): StreamNg;
    push(chunk: any, callback?: errorCallback): StreamNg;
    pair(dst: any, options: any): StreamNg;
}
export default StreamNg;
