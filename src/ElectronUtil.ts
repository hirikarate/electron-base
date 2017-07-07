
// Add read-only property
Object.defineProperty(global, 'appRoot', {
	value: process.cwd(),
	writable: false
});

import { ipcRenderer } from 'electron';


const ERROR_MSG = 'This function is only available on renderer process';

export class ElectronUtil {

	/**
	 * Calls a function from main process asynchronously
	 * @param func Function name.
	 * @param callback A function that accepts (error, result) as arguments.
	 * @param params List of parameters to send to the function.
	 */
	public static callMain(func: string, callback, ...params) {
		if (!ipcRenderer) {
			throw ERROR_MSG;
		}

		let responseChannel = func + '-response';
		
		ipcRenderer.once(responseChannel, (event, arg) => {
			if (!callback) { return; }
			callback(arg.error, arg.result);
		});
		
		ipcRenderer.send('async-func-call', {
			func: func,
			params: Array.prototype.slice.call(arguments, 2),
			response: responseChannel
		});		
	}

	/**
	 * Calls a function from main process and waits for it to complete.
	 * @param params List of parameters to send to the function.
	 * @param params 
	 */
	public static callMainSync(func: string, params?: any): { result, error } {
		if (!ipcRenderer) {
			throw ERROR_MSG;
		}
		return <any>ipcRenderer.sendSync('sync-func-call', {
			func: func,
			params: Array.prototype.slice.call(arguments, 1)
		});
	}
}

if (ipcRenderer) {
	// Get application root path from main thread.
	global['appRoot'] = ElectronUtil.callMainSync('appRoot').result;
	global['webRoot'] = ElectronUtil.callMainSync('webRoot').result;
}