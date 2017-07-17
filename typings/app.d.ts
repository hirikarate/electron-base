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
	/**
	 * Use this base class instead of `new BrowserWindow()`.
	 * Note: Always call `super.on...()` when overriding
	 * event methods such as `onContentLoading`, `onClosing` etc.
	 */
	export abstract class ElectronWindowBase {
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
	     * Gets Electron native browser window.
	     * This is a workaround until this issue is fixed: https://github.com/electron/electron/issues/10019
	     */
	    readonly native: Electron.BrowserWindow;
	    /**
	     * Gets option "triggerGlobalClose" value.
	     */
	    readonly triggerGlobalClose: boolean;
	    /**
	     * Gets Electron native web contents.
	     */
	    readonly webContents: Electron.WebContents;
	    /**
	     * @param _name Name of this window
	     */
	    constructor(_name: string, _options?: BrowserWindowConstructorOptions);
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
	     * Try to close the window. This has the same effect as a user manually clicking
	     * the close button of the window. The web page may cancel the close though. See
	     * the close event.
	     */
	    close(): void;
	    /**
	     * Forces closing the window, the unload and beforeunload event won't be emitted for
	     * the web page, and close event will also not be emitted for this window, but it
	     * guarantees the closed event will be emitted.
	     */
	    destroy(): void;
	    /**
	     * Focuses on the window.
	     */
	    focus(): void;
	    isFocused(): boolean;
	    isFullScreen(): boolean;
	    isKiosk(): boolean;
	    isModal(): boolean;
	    /**
	     * Maximizes the window. This will also show (but not focus) the window if it isn't
	     * being displayed already.
	     */
	    maximize(): void;
	    /**
	     * Minimizes the window. On some platforms the minimized window will be shown in
	     * the Dock.
	     */
	    minimize(): void;
	    /**
	     * Reloads the current web page.
	     */
	    reload(): void;
	    /**
	     * Restores the window from minimized state to its previous state.
	     */
	    restore(): void;
	    /**
	     * Enters or leaves the kiosk mode.
	     */
	    setKiosk(flag: boolean): void;
	    /**
	     * Displays a modal dialog that tells user something.
	     * This is similar to `alert()` function.
	     */
	    showInfoBox(title: string, content: string, detail?: string): Promise<void>;
	    /**
	     * Displays a modal dialog that asks user to choose Yes or No.
	     * This is similar to `confirm()` function.
	     */
	    showConfirmBox(title: string, content: string, detail?: string): Promise<boolean>;
	    /**
	     * Displays a modal dialog that shows an error message.
	     */
	    showErrorBox(title: string, content: string, detail?: string): Promise<void>;
	    /**
	     * Shows a dialog to select folders to open.
	     * @return A promise to resolve to an array of selected paths, and to null if user cancels the dialog.
	     */
	    showOpenDialog(options?: Electron.OpenDialogOptions): Promise<string[]>;
	    /**
	     * Shows a dialog to select a file to save.
	     * @return A promise to resolve to the selected path, and to null if user cancels the dialog.
	     */
	    showSaveDialog(options?: Electron.SaveDialogOptions): Promise<string>;
	    /**
	     * Shows a message dialog.
	     * @return A promise to resolve to:
	     * 	`response` is index of the clicked button;
	     * 	`checkboxChecked` tells whether user selects the checkbox (if visible)
	     */
	    showMessageBox(options?: Electron.MessageBoxOptions): Promise<{
	        response: number;
	        checkboxChecked: boolean;
	    }>;
	    /**
	     * Unmaximizes the window.
	     */
	    unmaximize(): void;
	    /**
	     * Sets whether the window should be in fullscreen mode.
	     */
	    setFullScreen(flag: boolean): void;
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
declare module 'front-lib-electron-base/MainLogger' {
	import 'winston-daily-rotate-file';
	export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
	export interface LoggerOptions {
	    /**
	     * Path to directory in which debug file is created.
	     * Default is: {appRoot}/logs/debug.log
	     */
	    debugDirPath?: string;
	    /**
	     * Path to directory in which error file is created.
	     * Default is: {appRoot}/logs/error.log
	     */
	    errorDirPath?: string;
	}
	/**
	 * Logger for main process, writes logs to system console and files.
	 */
	export class MainLogger {
	    	    	    	    	    constructor(_options?: LoggerOptions);
	    /**
	     * Writes message to console.
	     */
	    info(message: any): Promise<void>;
	    /**
	     * Writes message to console and debug file.
	     */
	    debug(message: any): Promise<void>;
	    /**
	     * Writes message to console and error file.
	     */
	    warn(message: any): Promise<void>;
	    /**
	     * Writes message to console and error file.
	     */
	    error(message: any): Promise<void>;
	    	    	    	    	    	}

}
declare module 'front-lib-electron-base/ElectronAppBase' {
	/// <reference types="electron" />
	import { ElectronWindowBase } from 'front-lib-electron-base/ElectronWindowBase';
	import { MainLogger } from 'front-lib-electron-base/MainLogger';
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
	    logDirPath?: string;
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
	    /**
	     * Whether this code is packed in .asar archive.
	     */
	    packMode?: boolean;
	}
	export abstract class ElectronAppBase {
	    	    protected readonly _windows: Map<string, ElectronWindowBase>;
	    protected readonly _quitHandlers: ((force: boolean) => Promise<boolean>)[];
	    protected _viewRoot: string;
	    	    	    	    	    	    	    /**
	     * Gets logger.
	     */
	    readonly logger: MainLogger;
	    /**
	     * Gets application settings.
	     */
	    readonly options: ElectronAppOptions;
	    /**
	     * Gets absolute path to folder that contains html files.
	     */
	    readonly viewRoot: string;
	    /**
	     * Gets Electron application instance.
	     */
	    protected readonly core: Electron.App;
	    /**
	     * Gets Electron dialog instance.
	     */
	    protected readonly dialog: Electron.Dialog;
	    /**
	     * Gets IPC of main process.
	    */
	    protected readonly ipcMain: Electron.IpcMain;
	    constructor(appRoot: string, _options?: ElectronAppOptions);
	    abstract isDebug(): boolean;
	    /**
	     * Starts application
	     */
	    start(): void;
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
	    findWindow(name: string): ElectronWindowBase;
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
	     * Adds a listener to call when an error occurs.
	     */
	    onError(message: any): void;
	    /**
	     * Displays a modal dialog that shows an error message. This API can be called
	     * safely before the ready event the app module emits, it is usually used to report
	     * errors in early stage of startup.  If called before the app readyevent on Linux,
	     * the message will be emitted to stderr, and no GUI dialog will appear.
	     */
	    showErrorBox(title: string, content: string): void;
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
	    	    	    	    	    	    	    	    	}

}
declare module 'front-lib-electron-base/RendererLogger' {
	import { MainLogger } from 'front-lib-electron-base/MainLogger';
	/**
	 * Logger for renderer process, writes debug logs to browser console,
	 * and delegates error logs to main logger to write to files.
	 */
	export class RendererLogger {
	    	    constructor(_mainLogger: MainLogger);
	    /**
	     * Writes info message to browser console.
	     * @param message A string, support %s (string), %i (number).
	     */
	    info(message: any): void;
	    /**
	     * Writes debug message to browser console.
	     * @param message A string, support %s (string), %i (number).
	     */
	    debug(message: any): void;
	    /**
	     * Writes warn message to browser console.
	     * @param message A string, support %s (string), %i (number).
	     */
	    warn(message: any): void;
	    /**
	     * Writes error message to browser console AND sends to main process to dumb to file.
	     * @param message A string, support %s (string), %i (number).
	     */
	    error(message: any): void;
	}

}
declare module 'front-lib-electron-base/RendererUtil' {
	import { ElectronAppBase } from 'front-lib-electron-base/ElectronAppBase';
	import { ElectronWindowBase } from 'front-lib-electron-base/ElectronWindowBase';
	import { RendererLogger } from 'front-lib-electron-base/RendererLogger';
	export class RendererUtil {
	    	    	    	    	    constructor();
	    readonly logger: RendererLogger;
	    /**
	     * Gets instance of main app class.
	     */
	    readonly mainApp: ElectronAppBase;
	    /**
	     * Gets instance of parent window of this renderer process.
	     */
	    readonly parentWindow: ElectronWindowBase;
	    /**
	     * Calls a method from app class asynchronously, it will run on main process.
	     * Unlike `callIpc`, this method can send and receive all types of JS objects.
	     * @param func Function name.
	     * @param params List of parameters to send to the remote method.
	     */
	    callRemoteMain(func: string, ...params: any[]): Promise<any>;
	    /**
	     * Calls a method from app class and waits for it to complete, it will run on main process.
	     * Unlike `callIpcSync`, this method can send and receive all types of JS objects.
	     * @param func Function name.
	     * @param params List of parameters to send to the remote method.
	     */
	    callRemoteMainSync(func: string, ...params: any[]): any;
	    /**
	     * Calls a method from parent window asynchronously, it will run on main process.
	     * Unlike `callIpc`, this method can send and receive all types of JS objects.
	     * @param func Function name.
	     * @param params List of parameters to send to the remote method.
	     */
	    callRemoteWindow(func: string, ...params: any[]): Promise<any>;
	    /**
	     * Calls a method from parent window and waits for it to complete, it will run on main process.
	     * Unlike `callIpc`, this method can send and receive all types of JS objects.
	     * @param func Function name.
	     * @param params List of parameters to send to the remote method.
	     */
	    callRemoteWindowSync(func: string, ...params: any[]): any;
	    /**
	     * @deprecated
	     * Calls a function from main process asynchronously with inter-process message.
	     * Can only send and receive serialziable JSON objects.
	     * @param windowName The window name to call functions from. If null, call function in app class.
	     * @param func Function name.
	     * @param params List of parameters to send to the function.
	     */
	    callIpc(windowName: string, func: string, ...params: any[]): Promise<any>;
	    /**
	     * @deprecated
	     * Calls a function from main process and waits for it to complete.
	     * Can only send and receive serialziable JSON objects.
	     * @param windowName The window name to call functions from. If null, call function in app class.
	     * @param func Function name.
	     * @param params List of parameters to send to the function.
	     */
	    callIpcSync(windowName: string, func: string, ...params: any[]): {
	        result;
	        error;
	    };
	    	    /**
	     * Copies global vars from main process to renderer process.
	     */
	    	}
	export const rendererUtil: RendererUtil;

}
declare module 'front-lib-electron-base' {
	export * from 'front-lib-electron-base/ElectronAppBase';
	export { rendererUtil } from 'front-lib-electron-base/RendererUtil';
	export * from 'front-lib-electron-base/ElectronWindowBase';

}
