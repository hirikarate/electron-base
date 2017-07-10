/// <reference path="./global.d.ts" />

declare module 'front-lib-electron-base/ElectronWindowBase' {
	/// <reference types="electron" />
	import { ElectronAppBase } from 'front-lib-electron-base/ElectronAppBase';
	export interface BrowserWindowConstructorOptions extends Electron.BrowserWindowConstructorOptions {
	    /**
	     * Whether to trigger global close action.
	     * Only takes effect when `ElectronAppOptions.globalClose=true`.
	     * Default is "false".
	     */
	    triggerGlobalClose?: boolean;
	}
	export const BrowserWindow: typeof Electron.BrowserWindow;
	/**
	 * Use this base class instead of `new BrowserWindow()`.
	 * Note: Always call `super.on...()` when overriding
	 * event methods such as `onContentLoading`, `onClosing` etc.
	 */
	export abstract class ElectronWindowBase extends BrowserWindow {
	    protected readonly _name: string;
	    /**
	     * Gets this window's name.
	     */
	    readonly name: string;
	    /**
	     * Gets parent app of this window.
	     */
	    /**
	     * Sets parent app of this window.
	     */
	    app: ElectronAppBase;
	    /**
	     * Gets option "triggerGlobalClose" value.
	     */
	    readonly triggerGlobalClose: boolean;
	    /**
	     * @param _name Name of this window
	     */
	    constructor(_name: string, options?: BrowserWindowConstructorOptions);
	    /**
	     * Do not call this method explicitly. It should be called in ElectronAppBase.addWindow
	     */
	    abstract start(): void;
	    /**
	     * Clears HTTP cache.
	     */
	    clearCache(): Promise<void>;
	    /**
	     * Clears all types of storage, not including HTTP cache.
	     */
	    clearStorage(): Promise<void>;
	    /**
	     * Builds and gets absolute path from specified file path.
	     * @param filePath Relative path to .html file.
	     */
	    protected getView(filePath: string): string;
	    /**
	     * Loads view from specified file path.
	     * @param filePath Relative path to .html file.
	     */
	    protected loadView(filePath: string, options?: Electron.LoadURLOptions): void;
	    /**
	     * Occurs when the window is going to be closed.
	     * It’s emitted before the beforeunload and unload event of the DOM.
	     * Calling event.preventDefault() will cancel the close.
	     */
	    protected onClosing(event: Electron.Event): void;
	    /**
	     * Occurs after the window has been closed.
	     * After you have received this event you should remove
	     * the reference to the window and avoid using it any more.
	     */
	    protected onClosed(): void;
	    /**
	     * Occurs when the window loses focus.
	     */
	    protected onBlur(): void;
	    /**
	     * Occurs when the window gains focus.
	     */
	    protected onFocus(): void;
	    /**
	     * Occurs when the web page has been rendered
	     * (while not being shown) and window can be displayed without a visual flash.
	     */
	    protected onShowing(): void;
	    /**
	     * Occurs after the window has been shown.
	     */
	    protected onShown(): void;
	    /**
	     * Occurs when the spinner of the tab started spinning.
	     */
	    protected onContentLoading(): void;
	    /**
	     * Occurs when the navigation is done, i.e. the spinner of the tab has stopped
	     * spinning, and the onload event was dispatched.
	     */
	    protected onContentLoaded(): void;
	    /**
	     * Occurs when the document in the given frame is loaded.
	     */
	    protected onContentDomReady(event: Electron.Event): void;
	}

}
declare module 'front-lib-electron-base/ElectronAppBase' {
	/// <reference types="electron" />
	/// <reference types="node" />
	/// <reference types="winston" />
	import { EventEmitter } from 'events';
	import * as winston from 'winston';
	import { ElectronWindowBase } from 'front-lib-electron-base/ElectronWindowBase';
	export type ElectronAppLogLevel = 'debug' | 'info' | 'warn' | 'error';
	export interface ElectronAppOptions {
	    /**
	     * Whether to close all windows when one windows is closed. All windows' closing events are triggered as normal.
	     * This option is often used with `quitWhenAllWindowsClosed=true`.
	     * Default is "false".
	     */
	    globalClose?: boolean;
	    /**
	     * Path to the folder where log files are created.
	     * Default is "{appRoot}/logs".
	     */
	    logFilePath?: string;
	    /**
	     * Whether to server static files (css, jpg,...) via a embeded server.
	     * Default is "true".
	     */
	    serveStaticFiles?: boolean;
	    /**
	     * Domain name for file server, if serveStaticFiles is enabled.
	     * Default is "localhost".
	     */
	    staticFileDomain?: string;
	    /**
	     * Port for file server, if serveStaticFiles is enabled.
	     * Default is "30000".
	     */
	    staticFilePort?: number;
	    /**
	     * Whether to quit application when all windows are closed.
	     * Default is "true".
	     */
	    quitWhenAllWindowsClosed?: boolean;
	}
	export abstract class ElectronAppBase {
	    protected readonly _windows: Map<string, Electron.BrowserWindow>;
	    protected readonly _event: EventEmitter;
	    protected readonly _quitHandlers: ((force: boolean) => Promise<boolean>)[];
	    protected _logger: winston.LoggerInstance;
	    protected _viewRoot: string;
	    /**
	     * Gets absolute path to folder that contains html files.
	     */
	    readonly viewRoot: string;
	    /**
	     * Gets Electron application instance.
	     */
	    protected readonly core: Electron.App;
	    /**
	     * Gets IPC of main process.
	    */
	    protected readonly ipcMain: Electron.IpcMain;
	    constructor(_options?: ElectronAppOptions);
	    abstract isDebug(): boolean;
	    /**
	     * Starts application
	     */
	    start(): void;
	    /**
	     * Writes logging message.
	     */
	    log(level: ElectronAppLogLevel, message: any): Promise<void>;
	    /**
	     * Attempts to quit this application, however one of the quit handlers can
	     * prevent this process if `force` is false.
	     * @param force Quit the app regardless somebody wants to prevent.
	     * @return If quit process is successful or not.
	     */
	    quit(force?: boolean): Promise<boolean>;
	    /**
	     * Stores this window reference and adds neccessary events to manage it.
	     */
	    addWindow<T extends ElectronWindowBase>(window: T): T;
	    /**
	     * Reloads window with specified `name`, or reloads all if no name is given.
	     * @param name If specified, reload window with this name.
	     */
	    reload(name?: string): void;
	    /**
	     * Enables full screen for window with specified `name`, or sets full screen for all if no name is given.
	     * @param name If specified, reload window with this name.
	     */
	    goFullScreen(name?: string): void;
	    /**
	     * Adds a listener to call before quit.
	     * @param handler If this handler resolves to falsey value, it cancels quit process.
	     */
	    addQuitListener(handler: (force: boolean) => Promise<boolean>): void;
	    /**
	     * Clears HTTP cache.
	     */
	    clearCache(): Promise<void>;
	    /**
	     * Clears all types of storage, not including HTTP cache.
	     */
	    clearStorage(): Promise<void>;
	    /**
	     * Gets all display screens available on this machine.
	     */
	    getAllDisplays(): Electron.Display[];
	    /**
	     * Gets the 2nd display screen (if any) on this machine.
	     * If you want to get more displays, use `getAllDisplays`.
	     * @return A display object, or null if there is only one display available.
	     */
	    getSecondDisplay(): Electron.Display;
	    /**
	     * Executes an OS command.
	     */
	    protected execCmd(command: string, options?: any): string;
	    /**
	     * Occurs after application window is focused by user.
	     */
	    protected onActivated(): void;
	    /**
	     * Occurs after all windows have been closed.
	     */
	    protected onAllWindowsClosed(): void;
	    /**
	     * Occurs before application creates any windows.
	     */
	    protected onStarting(): void;
	    /**
	     * Occurs after application has created all windows.
	     */
	    protected onStarted(): void;
	    /**
	     * Adds a listener to call when an error occurs.
	     */
	    protected onError(message: string): void;
	}

}
declare module 'front-lib-electron-base/RendererUtil' {
	import { ElectronAppBase } from 'front-lib-electron-base/ElectronAppBase';
	import { ElectronWindowBase } from 'front-lib-electron-base/ElectronWindowBase';
	export const parentWindow: ElectronWindowBase;
	export const mainApp: ElectronAppBase;
	export class RendererUtil {
	    /**
	     * Copies global vars from main process to renderer process.
	     */
	    static shareGlobalVars(): void;
	    /**
	     * Calls a method from app class asynchronously, it will run on main process.
	     * Unlike `callIpc`, this method can send and receive all types of JS objects.
	     * @param func Function name.
	     * @param params List of parameters to send to the remote method.
	     */
	    static callRemoteMain(func: string, ...params: any[]): Promise<any>;
	    /**
	     * Calls a method from app class and waits for it to complete, it will run on main process.
	     * Unlike `callIpcSync`, this method can send and receive all types of JS objects.
	     * @param func Function name.
	     * @param params List of parameters to send to the remote method.
	     */
	    static callRemoteMainSync(func: string, ...params: any[]): any;
	    /**
	     * Calls a method from parent window asynchronously, it will run on main process.
	     * Unlike `callIpc`, this method can send and receive all types of JS objects.
	     * @param func Function name.
	     * @param params List of parameters to send to the remote method.
	     */
	    static callRemoteWindow(func: string, ...params: any[]): Promise<any>;
	    /**
	     * Calls a method from parent window and waits for it to complete, it will run on main process.
	     * Unlike `callIpc`, this method can send and receive all types of JS objects.
	     * @param func Function name.
	     * @param params List of parameters to send to the remote method.
	     */
	    static callRemoteWindowSync(func: string, ...params: any[]): any;
	    /**
	     * Calls a function from main process asynchronously with inter-process message.
	     * Can only send and receive serialziable JSON objects.
	     * @param windowName The window name to call functions from. If null, call function in app class.
	     * @param func Function name.
	     * @param params List of parameters to send to the function.
	     */
	    static callIpc(windowName: string, func: string, ...params: any[]): Promise<any>;
	    /**
	     * Calls a function from main process and waits for it to complete.
	     * Can only send and receive serialziable JSON objects.
	     * @param windowName The window name to call functions from. If null, call function in app class.
	     * @param func Function name.
	     * @param params List of parameters to send to the function.
	     */
	    static callIpcSync(windowName: string, func: string, ...params: any[]): {
	        result;
	        error;
	    };
	}

}
declare module 'front-lib-electron-base' {
	export * from 'front-lib-electron-base/ElectronAppBase';
	export * from 'front-lib-electron-base/RendererUtil';
	export * from 'front-lib-electron-base/ElectronWindowBase';

}
