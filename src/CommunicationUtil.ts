import { ipcMain, ipcRenderer, remote } from 'electron';
import * as shortid from 'shortid';

import { ElectronAppBase } from './ElectronAppBase';
import { ElectronWindowBase } from './ElectronWindowBase';
import { MainLogger } from './MainLogger';
import { RendererLogger } from './RendererLogger';


const NOT_RENDERER_ERROR = 'This function is only available on renderer process!',
	NOT_MAIN_ERROR = 'This function is only available on main process!',
	NOT_PROMISE_ERROR = 'This function does not return a Promise!';


export abstract class CommunicationUtil {

	private constructor() {}

	/**
	 * Calls a method from main app class and waits for response, it will run on main process.
	 * Can only send and receive serialziable JSON objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public static callAppSync(func: string, ...params) {
		this.assertRenderer();
		return ipcRenderer.sendSync('sync-func-call-' + '__app__', { func, params });
	}

	/**
	 * Calls a method from window class and waits for response, it will run on main process.
	 * Can only send and receive serialziable JSON objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public static callWindowSync(func: string, ...params) {
		this.assertRenderer();
		const { rendererUtil } = require('./RendererUtil');
		let parentName = rendererUtil.parentWindow.name;
		return ipcRenderer.sendSync('sync-func-call-' + parentName, { func, params });
	}

	/**
	 * Calls a method from main app class, it will run on main process.
	 * Can only send and receive serialziable JSON objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public static callApp(func: string, ...params): Promise<any> {
		this.assertRenderer();
		return this.callRemoteMain('__app__', func, ...params);
	}

	/**
	 * Calls a method from window class, it will run on main process.
	 * Can only send and receive serialziable JSON objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public static callWindow(func: string, ...params): Promise<any> {
		this.assertRenderer();
		const { rendererUtil } = require('./RendererUtil');
		let parentName = rendererUtil.parentWindow.name;
		return this.callRemoteMain(parentName, func, ...params);
	}

	/**
	 * Calls a method from renderer process, it will run on renderern process.
	 * Can only send and receive serialziable JSON objects.
	 * @param browserWindow Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public static callRenderer(browserWindow: Electron.BrowserWindow, func: string, ...params): Promise<any> {
		this.assertMain();
		return new Promise<any>((resolve, reject) => {
			let responseTo = shortid.generate();

			ipcMain['_callQueue'] = ipcMain['_callQueue'] || {};
			ipcMain['_callQueue'][responseTo] = { resolve, reject };

			browserWindow.webContents.send('renderer-func-call', {
				func,
				params,
				responseTo
			});
		});
	}

	/**
	 * Accepts incoming request to execute functions.
	 * @param context The object to call functions from.
	 */
	public static startRendererCommunication(context): void {
		this.assertRenderer();
		// Allow renderer process to call a function in main process
		// arg = {
		// 		func: 'function name',
		//		params: ['array', 'of', 'parameters'],
		//		responseTo: <shortid token>
		// }
		ipcRenderer.on('renderer-func-call', (event, arg) => {
			let result = null, error: Error = null;
			try {
				result = context[arg.func].apply(context, arg.params);
			}
			catch (err) {
				error = err;
			}

			if (!result || (result && !result.then)) {
				event.sender.send('renderer-func-response', {
					result: result,
					error: !!error ? error + '' : null,
					responseTo: arg.responseTo
				});
			} else if (result && result.then) {
				result
					.then(data => {
						event.sender.send('renderer-func-response', {
							result: data,
							error: null,
							responseTo: arg.responseTo
						});
					})
					.catch((err: Error) => {
						event.sender.send('renderer-func-response', {
							result: null,
							error: err + '',
							responseTo: arg.responseTo
						});
					});
			}
		});
	}

	/**
	 * Accepts incoming request to main app class.
	 * @param context The object to call functions from.
	 */
	public static startAppCommunication(context): void {
		this.startMainCommunication('__app__', context);
	}

	/**
	 * Accepts incoming request to main app class.
	 * @param windowName The window name.
	 * @param context The object to call functions from.
	 */
	public static startWindowCommunication(windowName: string, context): void {
		this.startMainCommunication(windowName, context);
	}

	/**
	 * Accepts incoming request to execute functions.
	 * @param id An unique identification string to send ipc message to.
	 * @param context The object to call functions from.
	 */
	private static startMainCommunication(id: string, context): void {
		this.assertMain();
		// Allow renderer process to call a function in main process
		// arg = {
		// 		func: 'function name',
		//		params: ['array', 'of', 'parameters'],
		//		responseTo: 'response channel'
		// }
		ipcMain.on('async-func-call-' + id, (event, arg) => {
			let result = null, error = null;
			try {
				result = context[arg.func].apply(context, arg.params);
			}
			catch (ex) {
				error = ex;
			}

			if (!result || (result && !result.then)) {
				event.sender.send(arg.responseTo, {
					result: result,
					error: !!error ? error + '' : null,
				});
			} else if (result && result.then) {
				result
					.then(data => {
						event.sender.send(arg.responseTo, {
							result: data,
							error: null
						});
					})
					.catch(err => {
						event.sender.send(arg.responseTo, {
							result: null,
							error: err
						});
						console.error(err);
					});
			}
		});

		ipcMain.on('sync-func-call-' + id, (event, arg) => {
			let result = null,
				error = null;
			try {
				result = this[arg.func].apply(this, arg.params);
			} catch (ex) {
				error = ex;
			}

			event.returnValue = {
				result: result,
				error: error
			};
		});

		let rendererListener = ipcMain.listeners('renderer-func-response');
		if (!rendererListener || !rendererListener.length) {
			ipcMain.on('renderer-func-response', (event, arg) => {
				let queue = ipcMain['_callQueue'] || {},
					promise = queue[arg.responseTo];
				if (!promise) { return; }
				delete queue[arg.responseTo];
				if (arg.error) {
					return promise.reject(arg.error);
				}
				promise.resolve(arg.result);
			});
		}
	}

	/**
	 * Calls a method from main process, it will run on main process.
	 * Can only send and receive serialziable JSON objects.
	 * @param targetId The `id` param when the target calls `startIpcCommunication`.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	private static callRemoteMain(targetId: string, func: string, ...params): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			let responseTo = func + '-response';

			ipcRenderer.once(responseTo, (event, arg) => {
				if (arg.error) {
					return reject(arg.error);
				}
				resolve(arg.result);
			});

			ipcRenderer.send('async-func-call-' + targetId, {
				func,
				params,
				responseTo
			});
		});
	}

	private static assertRenderer(): void {
		if (!ipcRenderer) {
			throw new Error(NOT_RENDERER_ERROR);
		}
	}

	private static assertMain(): void {
		if (!ipcMain) {
			throw new Error(NOT_MAIN_ERROR);
		}
	}
}
