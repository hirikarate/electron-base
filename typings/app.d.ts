/// <reference path="./global.d.ts" />

declare module 'front-lib-electron-base/ElectronUtil' {
	export class ElectronUtil {
	    static callMain(func: string, callback: any, ...params: any[]): void;
	    static callMainSync(func: string, params?: any): {
	        result;
	        error;
	    };
	}

}
declare module 'front-lib-electron-base/ElectronWindowBase' {
	import * as eltr from 'electron';
	import { ElectronAppBase } from 'front-lib-electron-base/ElectronAppBase';
	export abstract class ElectronWindowBase extends eltr.BrowserWindow {
	    protected readonly _name: string;
	    readonly name: string;
	    app: ElectronAppBase;
	    constructor(_name: string, options?: Electron.BrowserWindowConstructorOptions);
	    abstract start(): void;
	    clearCache(): Promise<void>;
	    clearStorage(): Promise<void>;
	    onClosing(handler: (event: Electron.Event) => void): void;
	    onClosed(handler: Function): void;
	    onBlur(handler: Function): void;
	    onFocus(handler: Function): void;
	    onShowing(handler: Function): void;
	    onShown(handler: Function): void;
	    onContentLoading(handler: Function): void;
	    onContentLoaded(handler: Function): void;
	    onContentDomReady(handler: (event: Electron.Event) => void): void;
	}

}
declare module 'front-lib-electron-base/ElectronAppBase' {
	/// <reference types="node" />
	/// <reference types="winston" />
	import { EventEmitter } from 'events';
	import * as winston from 'winston';
	import 'front-lib-electron-base/ElectronUtil';
	import { ElectronWindowBase } from 'front-lib-electron-base/ElectronWindowBase';
	export type ElectronAppLogLevel = 'debug' | 'info' | 'warn' | 'error';
	export interface ElectronAppOptions {
	    logFilePath?: string;
	    serveStaticFiles?: boolean;
	    staticFileDomain?: string;
	    staticFilePort?: number;
	    quitWhenAllWindowsClosed?: boolean;
	}
	export abstract class ElectronAppBase {
	    protected readonly _windows: Map<string, Electron.BrowserWindow>;
	    protected readonly _event: EventEmitter;
	    protected readonly _quitHandlers: ((force: boolean) => Promise<boolean>)[];
	    protected _logger: winston.LoggerInstance;
	    protected readonly core: Electron.App;
	    protected readonly ipcMain: Electron.IpcMain;
	    constructor(_options?: ElectronAppOptions);
	    appRoot(): string;
	    webRoot(): string;
	    start(): void;
	    log(level: ElectronAppLogLevel, message: any): Promise<void>;
	    quit(force?: boolean): Promise<boolean>;
	    addWindow<T extends ElectronWindowBase>(window: T): T;
	    reload(name?: string): void;
	    goFullScreen(name?: string): void;
	    addQuitListener(handler: (force: boolean) => Promise<boolean>): void;
	    protected execCmd(command: string, options?: any): string;
	    protected onActivated(): void;
	    protected onAllWindowsClosed(): void;
	    protected onStarting(): void;
	    protected onStarted(): void;
	    protected onError(message: string): void;
	}

}
declare module 'front-lib-electron-base' {
	export * from 'front-lib-electron-base/ElectronAppBase';
	export * from 'front-lib-electron-base/ElectronUtil';
	export * from 'front-lib-electron-base/ElectronWindowBase';

}
