import { ipcMain, ipcRenderer } from 'electron'
import * as shortid from 'shortid'



const NOT_RENDERER_ERROR = 'This function is only available on renderer process!',
	NOT_MAIN_ERROR = 'This function is only available on main process!'


export abstract class CommunicationUtil {

	private constructor() {}

	/**
	 * Calls a method from main app class and waits for response, it will run on main process.
	 * Can only send and receive serialziable JSON objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public static callAppSync(func: string, ...params: any[]) {
		this.assertRenderer()
		return ipcRenderer.sendSync('sync-func-call-' + '__app__', { func, params })
	}

	/**
	 * Calls a method from window class and waits for response, it will run on main process.
	 * Can only send and receive serialziable JSON objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public static callWindowSync(func: string, ...params: any[]) {
		this.assertRenderer()
		const { rendererUtil } = require('./RendererUtil')
		const parentName = rendererUtil.parentWindow.name
		return ipcRenderer.sendSync('sync-func-call-' + parentName, { func, params })
	}

	/**
	 * Calls a method from main app class, it will run on main process.
	 * Can only send and receive serialziable JSON objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public static callApp(func: string, ...params: any[]): Promise<any> {
		this.assertRenderer()
		return this.callRemoteMain('__app__', func, ...params)
	}

	/**
	 * Calls a method from window class, it will run on main process.
	 * Can only send and receive serialziable JSON objects.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public static callWindow(func: string, ...params: any[]): Promise<any> {
		this.assertRenderer()
		const { rendererUtil } = require('./RendererUtil')
		const parentName = rendererUtil.parentWindow.name
		return this.callRemoteMain(parentName, func, ...params)
	}

	/**
	 * Calls a method from renderer process, it will run on renderern process.
	 * Can only send and receive serialziable JSON objects.
	 * @param browserWindow Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	public static callRenderer(browserWindow: Electron.BrowserWindow, func: string, ...params: any[]): Promise<any> {
		this.assertMain()
		return new Promise<any>((resolve, reject) => {
			const responseTo = shortid.generate()

			ipcMain['_callQueue'] = ipcMain['_callQueue'] || {}
			ipcMain['_callQueue'][responseTo] = { resolve, reject }

			browserWindow.webContents.send('renderer-func-call', {
				func,
				params,
				responseTo,
			})
		})
	}

	/**
	 * Accepts incoming request to execute functions.
	 * @param context The object to call functions from.
	 */
	public static startRendererCommunication(context: any): void {
		this.assertRenderer()
		// Allow renderer process to call a function in main process
		// arg = {
		//    func: 'function name',
		//    params: ['array', 'of', 'parameters'],
		//    responseTo: <shortid token>
		// }
		ipcRenderer.on('renderer-func-call', (event, arg) => {
			let result = null, error: Error = null
			try {
				result = context[arg.func].apply(context, arg.params)
			}
			catch (err) {
				error = err
			}

			if (!result || (result && !result.then)) {
				event.sender.send('renderer-func-response', {
					result: result,
					error: !!error ? error + '' : null,
					responseTo: arg.responseTo,
				})
			} else if (result && result.then) {
				result
					.then((data: any) => {
						event.sender.send('renderer-func-response', {
							result: data,
							error: null,
							responseTo: arg.responseTo,
						})
					})
					.catch((err: Error) => {
						event.sender.send('renderer-func-response', {
							result: null,
							error: err + '',
							responseTo: arg.responseTo,
						})
					})
			}
		})
	}

	/**
	 * Accepts incoming request to main app class.
	 * @param context The object to call functions from.
	 */
	public static startAppCommunication(context: any): void {
		this.startMainCommunication('__app__', context)
	}

	/**
	 * Accepts incoming request to main app class.
	 * @param windowName The window name.
	 * @param context The object to call functions from.
	 */
	public static startWindowCommunication(windowName: string, context: any): void {
		this.startMainCommunication(windowName, context)
	}

	/**
	 * Accepts incoming request to execute functions.
	 * @param id An unique identification string to send ipc message to.
	 * @param context The object to call functions from.
	 */
	private static startMainCommunication(id: string, context: any): void {
		this.assertMain()
		// Allow renderer process to call a function in main process
		// arg = {
		//    func: 'function name',
		//    params: ['array', 'of', 'parameters'],
		//    responseTo: 'response channel'
		// }
		ipcMain.on('async-func-call-' + id, (event, arg) => {
			let result = null, error = null
			try {
				result = context[arg.func].apply(context, arg.params)
			}
			catch (ex) {
				error = ex
			}

			if (!result || (result && !result.then)) {
				event.sender.send(arg.responseTo, {
					result: result,
					error: !!error ? error + '' : null,
				})
			} else if (result && result.then) {
				result
					.then((data: any) => {
						event.sender.send(arg.responseTo, {
							result: data,
							error: null,
						})
					})
					.catch((err: any) => {
						event.sender.send(arg.responseTo, {
							result: null,
							error: err,
						})
						console.error(err)
					})
			}
		})

		ipcMain.on('sync-func-call-' + id, (event, arg) => {
			let result = null,
				error = null
			try {
				result = context[arg.func].apply(context, arg.params)
			} catch (ex) {
				error = ex
			}

			event.returnValue = {
				result: result,
				error: error,
			}
		})

		const rendererListener = ipcMain.listeners('renderer-func-response')
		if (!rendererListener || !rendererListener.length) {
			ipcMain.on('renderer-func-response', (event, arg) => {
				const queue = ipcMain['_callQueue'] || {},
					promise = queue[arg.responseTo]
				if (!promise) { return }
				delete queue[arg.responseTo]
				if (arg.error) {
					return promise.reject(arg.error)
				}
				promise.resolve(arg.result)
			})
		}
	}

	/**
	 * Calls a method from main process, it will run on main process.
	 * Can only send and receive serialziable JSON objects.
	 * @param targetId The `id` param when the target calls `startIpcCommunication`.
	 * @param func Function name.
	 * @param params List of parameters to send to the remote method.
	 */
	private static callRemoteMain(targetId: string, func: string, ...params: any[]): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			const responseTo = func + '-response'

			ipcRenderer.once(responseTo, (event, arg) => {
				if (arg.error) {
					return reject(arg.error)
				}
				resolve(arg.result)
			})

			ipcRenderer.send('async-func-call-' + targetId, {
				func,
				params,
				responseTo,
			})
		})
	}

	private static assertRenderer(): void {
		if (!ipcRenderer) {
			throw new Error(NOT_RENDERER_ERROR)
		}
	}

	private static assertMain(): void {
		if (!ipcMain) {
			throw new Error(NOT_MAIN_ERROR)
		}
	}
}
