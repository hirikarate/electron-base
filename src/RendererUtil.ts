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


	constructor() {
		if (!ipcRenderer) {
			throw NOT_AVAIL_ERROR;
		}

		this._rendererLogger = new RendererLogger(this.mainApp.logger);
	}


	public get logger(): RendererLogger {
		return this._rendererLogger;
	}

	/**
	 * Gets instance of main app class.
	 */
	public get mainApp(): ElectronAppBase {
		return (ipcRenderer != null 
			? <ElectronAppBase>remote.getGlobal('app') 
			: null);
	}

	/**
	 * Gets instance of parent window of this renderer process.
	 */
	public get parentWindow(): ElectronWindowBase {
		let mainApp = this.mainApp;
		return (ipcRenderer != null && mainApp != null
			? mainApp.findWindow(remote.getCurrentWindow()['name'])
			: null);
	}


	/**
	 * Calls a method from app class asynchronously, it will run on main process.
	 * Unlike `callIpc`, this method can send and receive all types of JS objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public callRemoteMain(func: string, ...params): Promise<any> {
		let mainApp = this.mainApp,
			result = mainApp[func].apply(mainApp, params);
		
		if (!(result instanceof Promise)) {
			throw NOT_PROMISE_ERROR;
		}
		return result;
	}

	/**
	 * Calls a method from app class and waits for it to complete, it will run on main process.
	 * Unlike `callIpcSync`, this method can send and receive all types of JS objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public callRemoteMainSync(func: string, ...params): any {
		let mainApp = this.mainApp;
		return mainApp[func].apply(mainApp, params);
	}

	/**
	 * Calls a method from parent window asynchronously, it will run on main process.
	 * Unlike `callIpc`, this method can send and receive all types of JS objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public callRemoteWindow(func: string, ...params): Promise<any> {
		let parentWindow = this.parentWindow,
			result = parentWindow[func].apply(parentWindow, params);

		if (!(result instanceof Promise)) {
			throw NOT_PROMISE_ERROR;
		}
		return result;
	}

	/**
	 * Calls a method from parent window and waits for it to complete, it will run on main process.
	 * Unlike `callIpc`, this method can send and receive all types of JS objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public callRemoteWindowSync(func: string, ...params): any {
		let parentWindow = this.parentWindow;
		return parentWindow[func].apply(parentWindow, params);
	}

	/**
	 * @deprecated
	 * Calls a function from main process asynchronously with inter-process message.
	 * Can only send and receive serialziable JSON objects.
	 * @param windowName The window name to call functions from. If null, call function in app class.
	 * @param func Function name.
	 * @param params List of parameters to send to the function.
	 */
	public callIpc(windowName: string, func: string, ...params): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			let responseChannel = func + '-response';
			
			ipcRenderer.once(responseChannel, (event, arg) => {
				if (!arg.error) {
					reject(arg.error);
					return;
				}
				resolve(arg.result);
			});
			
			ipcRenderer.send('async-func-call', {
				func: func,
				params: Array.prototype.slice.call(arguments, 3),
				response: responseChannel,
				target: windowName
			});
		});
	}

	/**
	 * @deprecated
	 * Calls a function from main process and waits for it to complete.
	 * Can only send and receive serialziable JSON objects.
	 * @param windowName The window name to call functions from. If null, call function in app class.
	 * @param func Function name.
	 * @param params List of parameters to send to the function.
	 */
	public callIpcSync(windowName: string, func: string, ...params): { result, error } {
		return <any>ipcRenderer.sendSync('sync-func-call', {
			func: func,
			params: Array.prototype.slice.call(arguments, 2),
			target: windowName
		});
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
		this.addGlobal('windowName', this.parentWindow.name);
		return this;
	}

}

// Only export an instance if called on renderer process.
export const rendererUtil = (ipcRenderer != null
	? new RendererUtil()['shareGlobalVars']() // Intentionally call private method
	: null);
