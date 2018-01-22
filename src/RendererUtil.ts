import { ipcRenderer, remote } from 'electron';

import { ElectronAppBase } from './ElectronAppBase';
import { ElectronWindowBase } from './ElectronWindowBase';
import { RendererLogger } from './RendererLogger';


const NOT_AVAIL_ERROR = 'This function is only available on renderer process!';

export class RendererUtil {

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
		this.addGlobal('appDiskRoot', remote.getGlobal('appDiskRoot'));
		this.addGlobal('appCodeRoot', remote.getGlobal('appCodeRoot'));
		this.addGlobal('webRoot', remote.getGlobal('webRoot'));
		this.addGlobal('packMode', this._mainApp.options.packMode);
		this.addGlobal('isDebug', this._mainApp.isDebug);
		this.addGlobal('windowName', this._parentWindow.name);
		return this;
	}
}

// Only export an instance if called on renderer process.
export const rendererUtil = (ipcRenderer != null
	? new RendererUtil()['shareGlobalVars']() // Intentionally call private method
	: null);
