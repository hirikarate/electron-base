import { ipcRenderer, remote } from 'electron';

import { ElectronAppBase } from './ElectronAppBase';
import { ElectronWindowBase } from './ElectronWindowBase';
import { MainLogger } from './MainLogger';
import { RendererLogger } from './RendererLogger';


const NOT_AVAIL_ERROR = 'This function is only available on renderer process!',
	NOT_PROMISE_ERROR = 'This function does not return a Promise!';


export class RendererUtil {

	private _mainLogger: MainLogger;
	private _rendererLogger: RendererLogger;
	private _mainApp: ElectronAppBase;
	private _parentWindow: ElectronWindowBase;


	constructor() {
		if (!ipcRenderer) {
			throw NOT_AVAIL_ERROR;
		}

		this._mainApp = (ipcRenderer != null 
			? <ElectronAppBase>remote.getGlobal('app') 
			: null);

		this._parentWindow = (ipcRenderer != null && this._mainApp != null
			? this._mainApp.findWindow(remote.getCurrentWindow()['name'])
			: null);

		this._rendererLogger = new RendererLogger(this._mainApp.logger);
	}


	public get logger(): RendererLogger {
		return this._rendererLogger;
	}

	/**
	 * Gets instance of main app class.
	 */
	public get mainApp(): ElectronAppBase {
		return this._mainApp;
	}

	/**
	 * Gets instance of parent window of this renderer process.
	 */
	public get parentWindow(): ElectronWindowBase {
		return this._parentWindow;
	}

	/**
	 * Calls a method from app class, it will run on main process.
	 * Can only send and receive serialziable JSON objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public callRemoteMain(func: string, ...params): any & Promise<any> {
		let mainApp = this._mainApp;
		return mainApp[func].apply(mainApp, params);
	}

	/**
	 * Calls a method from parent window, it will run on main process.
	 * Can only send and receive serialziable JSON objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public callRemoteWindow(func: string, ...params): any & Promise<any> {
		let parentWindow = this._parentWindow;
		return parentWindow[func].apply(parentWindow, params);
	}


	private addGlobal(name, value) {
		if (global[name] !== undefined) { return; }

		Object.defineProperty(global, name, {
			value: value,
			writable: false // Add read-only property
		});
	}

	/**
	 * Copies global vars from main process to renderer process.
	 */
	private shareGlobalVars() {
		this.addGlobal('appRoot', remote.getGlobal('appRoot'));
		this.addGlobal('webRoot', remote.getGlobal('webRoot'));
		this.addGlobal('packMode', this._mainApp.options.packMode);
		this.addGlobal('windowName', this._parentWindow.name);
		return this;
	}

}

// Only export an instance if called on renderer process.
export const rendererUtil = (ipcRenderer != null
	? new RendererUtil()['shareGlobalVars']() // Intentionally call private method
	: null);
