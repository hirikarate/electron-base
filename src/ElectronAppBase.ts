import * as eltr from 'electron';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

import * as execSyncToBuffer from 'sync-exec';
const tinyCdn = require('tiny-cdn');

import { ElectronWindowBase } from './ElectronWindowBase';
import { MainLogger } from './MainLogger';


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
}

enum AppStatus { NotReady, Ready, Started }

export abstract class ElectronAppBase {

	protected readonly _windows: Map<string, ElectronWindowBase>;
	protected readonly _quitHandlers: ((force: boolean) => Promise<boolean>)[];
	protected _viewRoot: string;

	private readonly _core: Electron.App;
	private readonly _ipcMain: Electron.IpcMain;
	private readonly _logger: MainLogger;
	private _event: EventEmitter;
	private _isClosingAll: boolean;
	private _status: AppStatus;


	/**
	 * Gets logger.
	 */
	public get logger(): MainLogger {
		return this._logger;
	}

	/**
	 * Gets absolute path to folder that contains html files.
	 */
	public get viewRoot(): string {
		return this._viewRoot;
	}


	/**
	 * Gets Electron application instance.
	 */
	protected get core(): Electron.App {
		return this._core;
	}

	/**
	 * Gets Electron dialog instance.
	 */
	protected get dialog(): Electron.Dialog {
		return eltr.dialog;
	}

	/** 
	 * Gets IPC of main process.
	*/
	protected get ipcMain(): Electron.IpcMain {
		return this._ipcMain;
	}


	constructor(appRoot: string, private _options: ElectronAppOptions = {}) {
		
		// If this is main process
		if (eltr.ipcMain) {
			Object.defineProperty(global, 'appRoot', {
				value: appRoot,
				writable: false // Add read-only property
			});
		}

		this.initOptions(_options);

		this._core = eltr.app;
		this._ipcMain = eltr.ipcMain;
		this._windows = new Map<string, ElectronWindowBase>();
		this._logger = this.createLogger();

		this._event = new EventEmitter();
		this._quitHandlers = [];
		this._isClosingAll = false;
		this._viewRoot = `${global.appRoot}/views/`;
		this._status = AppStatus.NotReady;

		global.app = this;
	}


	public abstract isDebug(): boolean;

	/**
	 * Starts application
	 */
	public start(): void {
		this.onStarting();

		this.handleEvents();

		let startPromise = new Promise<void>(resolve => {
			// Only use this when your VGA is blacklisted by Chrome. Check chrome://gpu to know.
			this._core.commandLine.appendSwitch('ignore-gpu-blacklist', 'true');
			this.startCommunication();
			resolve();
		});

		if (this._options.serveStaticFiles) {
			startPromise = startPromise.then(() => this.serveStaticFiles());
		}

		startPromise = startPromise.catch(err => this.onError(err));

		let onAppReady = () => {
			startPromise.then(() => {
				this._status = AppStatus.Started;
				this.onStarted();
				startPromise = null;
				this._event = null;
			});
		};

		this._event.once('app-ready', onAppReady);

		if (this._status == AppStatus.Ready) {
			onAppReady.apply(this);
		}
	}

	/**
	 * Attempts to quit this application, however one of the quit handlers can
	 * prevent this process if `force` is false.
	 * @param force Quit the app regardless somebody wants to prevent.
	 * @return If quit process is successful or not.
	 */
	public quit(force: boolean = false): Promise<boolean> {
		let handlerPromises = this._quitHandlers.map(handler => handler(force));
		
		return Promise.all(handlerPromises).then(results => {
			// If at least one of the results is "false", cancel quit process.
			let cancel = results.reduce((prev, r) => r && prev, true);
			
			// If the app is forced to quit, or if nobody prevents it from quitting.
			if (force || !cancel) {
				this._core.quit();
				return true;
			}
			return false;
		});
	}

	/**
	 * Stores this window reference and adds neccessary events to manage it.
	 */
	public addWindow<T extends ElectronWindowBase>(window: T): T {
		window.app = this;
		this._windows.set(window.name, window);

		let native = window.native;
		native['name'] = window.name;
		native.webContents.on('did-start-loading', () => this.processEmbededServerUrl(native));

		native.on('closed', () => {
			this._windows.delete(window.name);
			
			if (!window.triggerGlobalClose) { return; }
			this.tryCloseAllWindows();
		});

		window.start();
		return window;
	}

	public findWindow(name: string): ElectronWindowBase {
		return this._windows.get(name);
	}

	/**
	 * Reloads window with specified `name`, or reloads all if no name is given.
	 * @param name If specified, reload window with this name.
	 */
	public reload(name?: string): void {
		if (name && this._windows.has(name)) {
			this._windows.get(name).reload();
			return;
		}
		this._windows.forEach(win => win.reload());
	}

	/**
	 * Enables full screen for window with specified `name`, or sets full screen for all if no name is given.
	 * @param name If specified, reload window with this name.
	 */
	public goFullScreen(name?: string): void {
		if (name && this._windows.has(name)) {
			this._windows.get(name).setFullScreen(true);
			return;
		}
		this._windows.forEach(win => win.setFullScreen(true));
	}

	/**
	 * Adds a listener to call before quit.
	 * @param handler If this handler resolves to falsey value, it cancels quit process.
	 */
	public addQuitListener(handler: (force: boolean) => Promise<boolean>): void {
		if (!handler || !(typeof handler == 'function')) {
			throw 'Handler is not a function!';
		}
		this._quitHandlers.push(handler);
	}

	/**
	 * Clears HTTP cache.
	 */
	public clearCache(): Promise<void> {
		return new Promise<void>((resolve) => {
			eltr.session.defaultSession.clearCache(resolve);
		});
	}

	/**
	 * Clears all types of storage, not including HTTP cache.
	 */
	public clearStorage(): Promise<void> {
		return new Promise<void>((resolve) => {
			let options = {
				storages: [
					'appcache',
					'cookies',
					'filesystem',
					'indexdb',
					'localstorage',
					'shadercache',
					'websql',
					'serviceworkers',
				],
				quotas: [
					'temporary',
					'persistent',
					'syncable',
				],
				origin: '*'
			};

			eltr.session.defaultSession.clearStorageData(options, resolve);
		});
	}

	/**
	 * Gets all display screens available on this machine.
	 */
	public getAllDisplays(): Electron.Display[] {
		return eltr.screen.getAllDisplays();
	}

	
	/**
	 * Gets the 2nd display screen (if any) on this machine. 
	 * If you want to get more displays, use `getAllDisplays`.
	 * @return A display object, or null if there is only one display available.
	 */
	public getSecondDisplay(): Electron.Display {
		let displays = this.getAllDisplays(),
			externalDisplay = null;

		for (let i in displays) {
			if (displays[i].bounds.x != 0 || displays[i].bounds.y != 0) {
			externalDisplay = displays[i];
			break;
			}
		}

		return externalDisplay;
	}

	/**
	 * Adds a listener to call when an error occurs.
	 */
	public onError(message: any): void {
		this._logger.error(message);
	}

	/**
	 * Displays a modal dialog that shows an error message. This API can be called
	 * safely before the ready event the app module emits, it is usually used to report
	 * errors in early stage of startup.  If called before the app readyevent on Linux,
	 * the message will be emitted to stderr, and no GUI dialog will appear.
	 */
	public showErrorBox(title: string, content: string): void {
		eltr.dialog.showErrorBox(title, content);
	}


	/**
	 * Executes an OS command.
	 */
	protected execCmd(command: string, options?): string {
		options = options || {};

		let results = execSyncToBuffer(command, options);

		if (!results.status) {
			return results.stdout;
		}

		throw {
			stderr: results.stderr
		};
	}

	/**
	 * Occurs after application window is focused by user.
	 */
	protected onActivated(): void {
	}

	/**
	 * Occurs after all windows have been closed.
	 */
	protected onAllWindowsClosed(): void {
	}

	/**
	 * Occurs before application creates any windows.
	 */
	protected onStarting(): void {
	}

	/**
	 * Occurs after application has created all windows.
	 */
	protected onStarted(): void {
	}


	private createLogger(): MainLogger {
		let dirPath = this._options.logDirPath,
			loggerOpts = dirPath
				? {
					debugDirPath: dirPath,
					errorDirPath: dirPath,
				}
				: null;

		return new MainLogger(loggerOpts);
	}

	private initOptions(options: ElectronAppOptions): ElectronAppOptions {
		const DEFAULT_OPTS: ElectronAppOptions = {
			globalClose: false,
			logDirPath: path.join(process.cwd(), 'logs'),
			quitWhenAllWindowsClosed: true,
			serveStaticFiles: true,
			staticFileDomain: 'localhost',
			staticFilePort: 30000
		};

		return this._options = Object.assign(DEFAULT_OPTS, options);
	}

	private tryCloseAllWindows(): void {
		if (!this._options.globalClose || this._isClosingAll) { return; }

		// Turn on flag to prevent this method from being called multiple times by other window's 'closed' event.
		this._isClosingAll = true;
		
		this._windows.forEach((win: ElectronWindowBase) => {
			win.close();
			this._windows.delete(win.name);
		});
	}

	private handleEvents(): void {
		let app = this._core;
		
		// This method will be called when Electron has finished
		// initialization and is ready to create browser windows.
		// Some APIs can only be used after this event occurs.
		app.on('ready', () => {
			this._status = AppStatus.Ready;
			this._event.emit('app-ready');
		});

		// Quit when all windows are closed.
		app.on('window-all-closed', () => {
			this.onAllWindowsClosed();
			if (this._options.quitWhenAllWindowsClosed) {
				this._core.quit();
			}
		});

		app.on('activate', () => {
			this.onActivated();
		});
	}

	private processEmbededServerUrl(win: Electron.BrowserWindow): void {
		/**
		 * Transform resource file URLs
		 */
		const filter = {
			urls: []
		};
		win.webContents.session.webRequest.onBeforeRequest(filter, (detail: Electron.OnBeforeRequestDetails, cb: (response: Electron.Response) => void) => {
			//*
			const ROOT_PATH = '~/';
			let { url } = detail,
				pos = url.indexOf(ROOT_PATH),
				redirectURL = null;

			if (pos >= 0) {
				url = url.substring(pos + ROOT_PATH.length);
				// Map from "~/" to "localhost/""
				redirectURL = `${global.webRoot}/${url}`;
			}
			//*/
			// this.log('debug', 'Old URL: ' + url);
			// this.log('debug', 'New URL: ' + redirectURL);

			cb({ redirectURL });
		});
	}

	private serveStaticFiles(): Promise<void> {
		const CACHE_PATH = `${process.cwd()}/assets/tiny-cdn-cache`;
		let domain = this._options.staticFileDomain || 'localhost',
			port = this._options.staticFilePort || 30000;
		
		if (!fs.existsSync(CACHE_PATH)) {
			fs.mkdirSync(CACHE_PATH);
		}

		return new Promise<void>(resolve => {
			http.createServer(tinyCdn.create({
				source: process.cwd(),
				dest: CACHE_PATH,
			}))
			.listen(port, () => {
				// Add read-only property
				Object.defineProperty(global, 'webRoot', {
					value: `http://${domain}:${port}`,
					writable: false
				});

				resolve();
			})
			.on('error', (err) => this.onError(err));
		})
		.catch(err => {
			this.onError(err);
			process.exit();
		});
	}

	private startCommunication(): void {
		// Allow renderer process to call a function in main process
		// arg = {
		// 		func: 'function name',
		//		params: ['array', 'of', 'parameters'],
		//		response: 'response channel'
		// }
		this._ipcMain.on('async-func-call', (event, arg) => {
			let result = null,
				error = null,
				windowName = arg.target;

			try {
				// result = this[arg.func].apply(this, arg.params);
				if (!windowName) {
					// Call app class' method
					result = this[arg.func].apply(this, arg.params);
				} else if (this._windows.has(windowName)) {
					// Call method from this specified window
					let context = this._windows.get(windowName);
					result = context[arg.func].apply(context, arg.params);
				} else {
					throw 'Invalid target';
				}
			}
			catch (ex) {
				error = ex;
			}
			
			if (!result || (result && !result.then) ) {
				event.sender.send(arg.response, {
					result: result,
					error: error
				});
			} else if (result && result.then) {
				result
					.then(data => {
						event.sender.send(arg.response, {
							result: data,
							error: null
						});
					})
					.catch(err => {
						event.sender.send(arg.response, {
							result: null,
							error: err
						});
					});
			}
		});

		this._ipcMain.on('sync-func-call', (event, arg) => {
			let result = null,
				error = null,
				windowName = arg.target;

			try {
				if (!windowName) {
					// Call app class' method
					result = this[arg.func].apply(this, arg.params);
				} else if (this._windows.has(windowName)) {
					// Call method from this specified window
					let context = this._windows.get(windowName);
					result = context[arg.func].apply(context, arg.params);
				} else {
					throw 'Invalid target';
				}
			}
			catch (ex) {
				error = ex;
			}
			event.returnValue = {
				result: result,
				error: error
			};
		});
	}
}