
// Add read-only property
Object.defineProperty(global, 'appRoot', {
	value: process.cwd(),
	writable: false
});

import { ipcRenderer } from 'electron';


const ERROR_MSG = 'This function is only available on renderer process';

export class ElectronUtil {

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

	public static callMainSync(func, params?: any): any {
		if (!ipcRenderer) {
			throw ERROR_MSG;
		}
		return ipcRenderer.sendSync('sync-func-call', {
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