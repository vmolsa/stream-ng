export declare type TypedArray = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array | Uint8ClampedArray;
export declare type notifyCallback = () => void;
export declare type errorCallback = (error?: Error) => void;
export declare type resolveCallback = (result?: any) => void;
export declare type rejectCallback = (error: Error) => void;
export declare type dataCallback = (chunk: TypedArray | any, next: errorCallback) => void;
export declare type endCallback = (resolve: resolveCallback, reject: rejectCallback, arg?: any) => void;
export declare function once(callback: (...restOfArgs: any[]) => void, self?: any): (...restOfArgs: any[]) => void;
export declare function isTypedArray(arg: any): boolean;
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
    end?: endCallback;
}
export declare class Stream {
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
    private _promise;
    private _resolve;
    private _reject;
    protected _end: endCallback;
    protected _write: dataCallback;
    constructor(options?: Options);
    then(resolve: resolveCallback, reject?: rejectCallback): Stream;
    catch(reject: rejectCallback): Stream;
    finally(callback: any): Stream;
    readonly readable: boolean;
    readonly writable: boolean;
    readonly isOpening: boolean;
    readonly isRunning: boolean;
    readonly isClosing: boolean;
    readonly isClosed: boolean;
    readonly state: State;
    setState(state: State): Stream;
    open(callback: notifyCallback): Stream;
    close(callback: notifyCallback): Stream;
    pause(callback: notifyCallback): Stream;
    resume(callback: notifyCallback): Stream;
    drain(callback: notifyCallback): Stream;
    data(callback: dataCallback): Stream;
    end(arg?: any): Stream;
    private dispatchQueue();
    write(chunk: TypedArray | any, callback?: errorCallback): Stream;
    push(chunk: TypedArray | any, callback?: errorCallback): Stream;
    pipe(dst: Stream): Stream;
}
