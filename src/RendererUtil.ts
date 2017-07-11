import { ipcRenderer, remote } from 'electron';

import { ElectronAppBase } from './ElectronAppBase';
import { ElectronWindowBase } from './ElectronWindowBase';


const NOT_AVAIL_ERROR = 'This function is only available on renderer process!',
	NOT_PROMISE_ERROR = 'This function does not return a Promise!';

export const parentWindow = (ipcRenderer != null 
	? <ElectronWindowBase>remote.getCurrentWindow() 
	: null);

export const mainApp = (ipcRenderer != null 
	? <ElectronAppBase>remote.getGlobal('app') 
	: null);


let addGlobal = function (name, value) {
	if (global[name] !== undefined) { return; }

	Object.defineProperty(global, name, {
		value: value,
		writable: false // Add read-only property
	});
};

export class RendererUtil {

	/**
	 * Copies global vars from main process to renderer process.
	 */
	public static shareGlobalVars() {
		if (!ipcRenderer) {
			throw NOT_AVAIL_ERROR;
		}
		addGlobal('appRoot', remote.getGlobal('appRoot'));
		addGlobal('webRoot', remote.getGlobal('webRoot'));
		addGlobal('windowName', parentWindow.name);
	}

	/**
	 * Calls a method from app class asynchronously, it will run on main process.
	 * Unlike `callIpc`, this method can send and receive all types of JS objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public static callRemoteMain(func: string, ...params): Promise<any> {
		if (!ipcRenderer) {
			throw NOT_AVAIL_ERROR;
		}
		let result = mainApp[func].apply(mainApp, params);
		
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
	public static callRemoteMainSync(func: string, ...params): any {
		if (!ipcRenderer) {
			throw NOT_AVAIL_ERROR;
		}
		return mainApp[func].apply(mainApp, params);
	}

	/**
	 * Calls a method from parent window asynchronously, it will run on main process.
	 * Unlike `callIpc`, this method can send and receive all types of JS objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public static callRemoteWindow(func: string, ...params): Promise<any> {
		if (!ipcRenderer) {
			throw NOT_AVAIL_ERROR;
		}
		let result = parentWindow[func].apply(parentWindow, params);

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
	public static callRemoteWindowSync(func: string, ...params): any {
		if (!ipcRenderer) {
			throw NOT_AVAIL_ERROR;
		}

		return parentWindow[func].apply(parentWindow, params);
	}

	/**
	 * Calls a function from main process asynchronously with inter-process message.
	 * Can only send and receive serialziable JSON objects.
	 * @param windowName The window name to call functions from. If null, call function in app class.
	 * @param func Function name.
	 * @param params List of parameters to send to the function.
	 */
	public static callIpc(windowName: string, func: string, ...params): Promise<any> {
		if (!ipcRenderer) {
			throw NOT_AVAIL_ERROR;
		}

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
	 * Calls a function from main process and waits for it to complete.
	 * Can only send and receive serialziable JSON objects.
	 * @param windowName The window name to call functions from. If null, call function in app class.
	 * @param func Function name.
	 * @param params List of parameters to send to the function.
	 */
	public static callIpcSync(windowName: string, func: string, ...params): { result, error } {
		if (!ipcRenderer) {
			throw NOT_AVAIL_ERROR;
		}
		return <any>ipcRenderer.sendSync('sync-func-call', {
			func: func,
			params: Array.prototype.slice.call(arguments, 2),
			target: windowName
		});
	}
}