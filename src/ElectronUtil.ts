import { ipcRenderer } from 'electron';


const ERROR_MSG = 'This function is only available on renderer process';

/**
 * Returns a function that always as `windowName` passed as first param,
 * other params are the same as `func`.
 */
let delegate = function(windowName: string, func: Function): any {
	return function() {
		let argsWithoutWinName = Array.prototype.slice.call(arguments, 1),
			args = [windowName, ...argsWithoutWinName];
		func.apply(null, args);
	};
};

export class ElectronUtil {

	/**
	 * Assigns functions in this class to `global` variable.
	 * @param windowName The window name to call functions from.
	 */
	public static registerGlobalFunctions(windowName: string) {
		global['callMain'] = delegate(windowName, ElectronUtil.callMain);
		global['callMainSync'] = delegate(windowName, ElectronUtil.callMainSync);
	}

	/**
	 * Calls a function from main process asynchronously
	 * @param windowName The window name to call functions from. If null, call function in app class.
	 * @param func Function name.
	 * @param callback A function that accepts (error, result) as arguments.
	 * @param params List of parameters to send to the function.
	 */
	public static callMain(windowName: string, func: string, callback, ...params): void {
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
			params: Array.prototype.slice.call(arguments, 3),
			response: responseChannel,
			target: windowName
		});		
	}

	/**
	 * Calls a function from main process and waits for it to complete.
	 * @param windowName The window name to call functions from. If null, call function in app class.
	 * @param func Function name.
	 * @param params List of parameters to send to the function.
	 */
	public static callMainSync(windowName: string, func: string, ...params): { result, error } {
		if (!ipcRenderer) {
			throw ERROR_MSG;
		}
		return <any>ipcRenderer.sendSync('sync-func-call', {
			func: func,
			params: Array.prototype.slice.call(arguments, 2),
			target: windowName
		});
	}
}