import * as eltr from 'electron';
import { EventEmitter } from 'events';

import { Guard } from 'back-lib-common-util';


export abstract class ElectronWindowBase
	extends eltr.BrowserWindow {

	protected _app: Electron.App;

	public get name(): string {
		return this._name;
	}

	public set app(app: Electron.App) {
		this._app = app;
	}

	/**
	 * @param _name Name of this window
	 */
	constructor(
		protected readonly _name: string,
		options?: Electron.BrowserWindowConstructorOptions
	) {
		super(options);
	}

	/**
	 * Do not call this method explicitly. It should be called in ElectronAppBase.addWindow
	 */
	public abstract start(): void;

	public clearCache(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.webContents.session.clearCache(() => resolve);
		});
	}

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

			this.webContents.session.clearStorageData(options, resolve);
		});
	}


	/**
	 * Adds a listener to call when the window is going to be closed.
	 * It’s emitted before the beforeunload and unload event of the DOM.
	 * Calling event.preventDefault() will cancel the close.
	 */
	public onClosing(handler: (event: Electron.Event) => void) {
		Guard.assertDefined('handler', handler);
		this.on('close', handler);
	}

	/**
	 * Adds a listener to call after the window has been closed. 
	 * After you have received this event you should remove 
	 * the reference to the window and avoid using it any more.
	 */
	public onClosed(handler: Function) {
		Guard.assertDefined('handler', handler);
		this.on('closed', handler);
	}

	/**
	 * Adds a listener to call when the window loses focus.
	 */
	public onBlur(handler: Function) {
		Guard.assertDefined('handler', handler);
		this.on('blur', handler);
	}

	/**
	 * Adds a listener to call when the window gains focus.
	 */
	public onFocus(handler: Function) {
		Guard.assertDefined('handler', handler);
		this.on('focus', handler);
	}

	/**
	 * Adds a listener to call when the web page has been rendered 
	 * (while not being shown) and window can be displayed without a visual flash.
	 */
	public onShowing(handler: Function) {
		Guard.assertDefined('handler', handler);
		this.on('ready-to-show', handler);
	}

	/**
	 * Adds a listener to call after the window has been shown.
	 */
	public onShown(handler: Function) {
		Guard.assertDefined('handler', handler);
		this.on('show', handler);
	}

	/**
	 * Adds a listener to call when the spinner of the tab started spinning.
	 */
	public onContentLoading(handler: Function) {
		Guard.assertDefined('handler', handler);
		this.webContents.on('did-start-loading', handler);
	}

	/**
	 * Adds a listener to call when the navigation is done, i.e. the spinner of the tab has stopped
     * spinning, and the onload event was dispatched.
	 */
	public onContentLoaded(handler: Function) {
		Guard.assertDefined('handler', handler);
		this.webContents.on('did-finish-load', handler);
	}

	/**
	 * Adds a listener to call when the document in the given frame is loaded.
	 */
	public onContentDomReady(handler: (event: Electron.Event) => void) {
		Guard.assertDefined('handler', handler);
		this.webContents.on('dom-ready', handler);
	}
}