import * as eltr from 'electron';
import { EventEmitter } from 'events';
import * as path from 'path';

import { Guard } from 'back-lib-common-util';

import { ElectronAppBase } from './ElectronAppBase';

export interface BrowserWindowConstructorOptions
	extends Electron.BrowserWindowConstructorOptions {
	
	/**
	 * Whether to trigger global close action.
	 * Only takes effect when `ElectronAppOptions.globalClose=true`.
	 * Default is "false".
	 */
	triggerGlobalClose?: boolean;
}


export const BrowserWindow: typeof Electron.BrowserWindow = (eltr.ipcMain) ? eltr.BrowserWindow : null;

/**
 * Use this base class instead of `new BrowserWindow()`.
 * Note: Always call `super.on...()` when overriding 
 * event methods such as `onContentLoading`, `onClosing` etc.
 */
export abstract class ElectronWindowBase
	extends BrowserWindow {

	private _app: ElectronAppBase;
	private _triggerGlobalClose: boolean;

	/**
	 * Gets this window's name.
	 */
	public get name(): string {
		return this._name;
	}

	/**
	 * Gets parent app of this window.
	 */
	public get app(): ElectronAppBase {
		return this._app;
	}

	/**
	 * Sets parent app of this window.
	 */
	public set app(app: ElectronAppBase) {
		this._app = app;
	}

	/**
	 * Gets option "triggerGlobalClose" value.
	 */
	public get triggerGlobalClose(): boolean {
		return this._triggerGlobalClose;
	}

	/**
	 * @param _name Name of this window
	 */
	constructor(
		protected readonly _name: string,
		options?: BrowserWindowConstructorOptions
	) {
		super(options);
		this._triggerGlobalClose = (options.triggerGlobalClose == null ? true : false);

		this.handleEvents();
	}

	/**
	 * Do not call this method explicitly. It should be called in ElectronAppBase.addWindow
	 */
	public abstract start(): void;

	/**
	 * Clears HTTP cache.
	 */
	public clearCache(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.webContents.session.clearCache(resolve);
		});
	}

	/**
	 * Clears all types of storage, including HTTP cache.
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
	 * Builds and gets absolute path from specified file path.
	 * @param filePath Relative path to .html file.
	 */
	protected getView(filePath: string): string {
		return path.join(this._app.viewRoot, filePath);
	}

	/**
	 * Loads view from specified file path.
	 * @param filePath Relative path to .html file.
	 */
	protected loadView(filePath: string, options?: Electron.LoadURLOptions): void {
		let resource = 'file://' + this.getView(filePath);
		this.loadURL(resource);
	}

	/**
	 * Occurs when the window is going to be closed.
	 * It’s emitted before the beforeunload and unload event of the DOM.
	 * Calling event.preventDefault() will cancel the close.
	 */
	protected onClosing(): void {
	}

	/**
	 * Occurs after the window has been closed. 
	 * After you have received this event you should remove 
	 * the reference to the window and avoid using it any more.
	 */
	protected onClosed(): void {
	}

	/**
	 * Occurs when the window loses focus.
	 */
	protected onBlur(): void {
	}

	/**
	 * Occurs when the window gains focus.
	 */
	protected onFocus(): void {
	}

	/**
	 * Occurs when the web page has been rendered 
	 * (while not being shown) and window can be displayed without a visual flash.
	 */
	protected onShowing(): void {
	}

	/**
	 * Occurs after the window has been shown.
	 */
	protected onShown(): void {
	}

	/**
	 * Occurs when the spinner of the tab started spinning.
	 */
	protected onContentLoading(): void {
		this.webContents.executeJavaScript(`
			if (global) {
				global.windowName = '${this.name}';
				global.appRoot = '${global.appRoot}';
				global.webRoot = '${global.webRoot}';
			}
		`);
	}

	/**
	 * Occurs when the navigation is done, i.e. the spinner of the tab has stopped
     * spinning, and the onload event was dispatched.
	 */
	protected onContentLoaded(): void {
	}

	/**
	 * Occurs when the document in the given frame is loaded.
	 */
	protected onContentDomReady(event: Electron.Event) {
	}


	private handleEvents(): void {
		// Don't pass in a function like this: `this.on('close', this.onClosing.bind(this));`
		// Because `onClosing` can be overriden by children class.

		this.on('close', () => this.onClosing());
		this.on('closed', () => this.onClosed());
		this.on('blur', () => this.onBlur());
		this.on('focus', () => this.onFocus());
		this.on('ready-to-show', () => this.onShowing());
		this.on('show', () => this.onShown());
		this.webContents.on('did-start-loading', () => this.onContentLoading());
		this.webContents.on('did-finish-load', () => this.onContentLoaded());
		this.webContents.on('dom-ready', (event: Electron.Event) => this.onContentDomReady(event));
	}
}