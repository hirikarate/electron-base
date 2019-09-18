import * as eltr from 'electron'
import * as path from 'path'

import { ElectronAppBase } from './ElectronAppBase'
import { CommunicationUtil } from './CommunicationUtil'


export interface BrowserWindowConstructorOptions
	extends Electron.BrowserWindowConstructorOptions {

	/**
	 * Whether to trigger global close action.
	 * Only takes effect when `ElectronAppOptions.globalClose=true`.
	 * Default is "false".
	 */
	triggerGlobalClose?: boolean
}


// export const BrowserWindow: typeof Electron.BrowserWindow = (eltr.ipcMain) ? eltr.BrowserWindow : null;

/**
 * Use this base class instead of `new BrowserWindow()`.
 * Note: Always call `super.on...()` when overriding
 * event methods such as `onContentLoading`, `onClosing` etc.
 */
export abstract class ElectronWindowBase {

	private _app: ElectronAppBase
	private _internalWin: Electron.BrowserWindow
	private _triggerGlobalClose: boolean

	/**
	 * Gets this window's name.
	 */
	public get name(): string {
		return this._name
	}

	/**
	 * Gets or sets parent app of this window.
	 */
	public get app(): ElectronAppBase {
		return this._app
	}

	public set app(app: ElectronAppBase) {
		this._app = app
	}

	/**
	 * Gets Electron native browser window.
	 * This is a workaround until this issue is fixed: https://github.com/electron/electron/issues/10019
	 */
	public get native(): Electron.BrowserWindow {
		return this._internalWin
	}

	/**
	 * Gets option "triggerGlobalClose" value.
	 */
	public get triggerGlobalClose(): boolean {
		return this._triggerGlobalClose
	}

	/**
	 * Gets Electron native web contents.
	 */
	public get webContents(): Electron.WebContents {
		return this._internalWin.webContents
	}

	/**
	 * @param _name Name of this window
	 */
	constructor(
		protected readonly _name: string,
		private _options?: BrowserWindowConstructorOptions
	) {
		const options = this._options
		this._triggerGlobalClose = (options == null || options.triggerGlobalClose == null || options.triggerGlobalClose === true)

		this._internalWin = new eltr.BrowserWindow(options)
		this._internalWin.setTitle(this._name)
		this.handleEvents()
		CommunicationUtil.startWindowCommunication(_name, this)
	}

	/**
	 * Do not call this method explicitly. It should be called in ElectronAppBase.addWindow
	 */
	public abstract start(): void

	/**
	 * Clears HTTP cache.
	 */
	public clearCache(): Promise<void> {
		return this._internalWin.webContents.session.clearCache()
	}

	/**
	 * Clears all types of storage, not including HTTP cache.
	 */
	public clearStorage(): Promise<void> {
		return new Promise<void>((resolve) => {
			const options = {
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
				origin: '*',
			}

			eltr.session.defaultSession.clearStorageData(options, resolve)
		})
	}

	/**
	 * Try to close the window. This has the same effect as a user manually clicking
	 * the close button of the window. The web page may cancel the close though. See
	 * the close event.
	 */
	public close(): void {
		this.native.close()
	}

	/**
	 * Forces closing the window, the unload and beforeunload event won't be emitted for
	 * the web page, and close event will also not be emitted for this window, but it
	 * guarantees the closed event will be emitted.
	 */
	public destroy(): void {
		this.native.destroy()
	}

	/**
	 * Focuses on the window.
	 */
	public focus(): void {
		this.native.focus()
	}

	public isFocused(): boolean {
		return this.native.isFocused()
	}

	public isFullScreen(): boolean {
		return this.native.isFullScreen()
	}

	public isKiosk(): boolean {
		return this.native.isKiosk()
	}

	public isModal(): boolean {
		return this.native.isModal()
	}

	/**
	 * Maximizes the window. This will also show (but not focus) the window if it isn't
	 * being displayed already.
	 */
	public maximize(): void {
		this.native.maximize()
	}

	/**
	 * Minimizes the window. On some platforms the minimized window will be shown in
	 * the Dock.
	 */
	public minimize(): void {
		this.native.minimize()
	}

	/**
	 * Reloads the current web page.
	 */
	public reload(): void {
		this.native.reload()
	}

	/**
	 * Restores the window from minimized state to its previous state.
	 */
	public restore(): void {
		this.native.restore()
	}

	/**
	 * Enters or leaves the kiosk mode.
	 */
	public setKiosk(flag: boolean): void {
		this.native.setKiosk(flag)
	}


	/**
	 * Displays a modal dialog that tells user something.
	 * This is similar to `alert()` function.
	 */
	public showInfoBox(title: string, content: string, detail?: string): Promise<void> {
		return this.showMessageBox({
			buttons: ['OK'],
			message: content,
			title,
			detail,
			type: 'info',
			noLink: true,
		}).then((answer: any) => {
			return
		})
	}

	/**
	 * Displays a modal dialog that asks user to choose Yes or No.
	 * This is similar to `confirm()` function.
	 */
	public showConfirmBox(title: string, content: string, detail?: string): Promise<boolean> {
		return this.showMessageBox({
			buttons: ['Yes', 'No'],
			message: content,
			title,
			detail,
			defaultId: 1, // 'No' should be selected by default
			cancelId: 1,
			type: 'warning',
			noLink: true,
		}).then((answer: any) => {
			return (answer == 0)
		})
	}

	/**
	 * Displays a modal dialog that shows an error message.
	 */
	public showErrorBox(title: string, content: string, detail?: string): Promise<void> {
		return this.showMessageBox({
			buttons: ['OK'],
			message: content,
			title,
			detail,
			type: 'error',
		}).then((answer: any) => {
			return
		})
	}

	/**
	 * Shows a dialog to select folders to open.
	 * @return A promise to resolve to an array of selected paths, and to null if user cancels the dialog.
	 */
	public showOpenDialog(options?: Electron.OpenDialogOptions): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			eltr.dialog.showOpenDialog(this.native, options, (filePaths: string[]) => {
				// When user closes dialog, `filePaths.length == 1, `filePaths[0]` == undefined
				if (filePaths && filePaths.length && filePaths[0]) {
					resolve(filePaths)
					return
				}
				resolve(null)
			})
		})
	}

	/**
	 * Shows a dialog to select a file to save.
	 * @return A promise to resolve to the selected path, and to null if user cancels the dialog.
	 */
	public showSaveDialog(options?: Electron.SaveDialogOptions): Promise<eltr.SaveDialogReturnValue> {
		return eltr.dialog.showSaveDialog(this.native, options)
	}

	/**
	 * Shows a message dialog.
	 * @return A promise to resolve to:
	 * 	`response` is index of the clicked button;
	 * 	`checkboxChecked` tells whether user selects the checkbox (if visible)
	 */
	public showMessageBox(options?: Electron.MessageBoxOptions): Promise<eltr.MessageBoxReturnValue> {
		return eltr.dialog.showMessageBox(this.native, options)
	}

	/**
	 * Builds and gets absolute path from specified file path.
	 * @param filePath Relative path to .html file.
	 */
	protected getView(filePath: string): string {
		return path.join(this._app.viewRoot, filePath)
	}

	/**
	 * Loads view from specified file path.
	 * @param filePath Relative path to .html file.
	 */
	protected loadView(filePath: string, options?: Electron.LoadURLOptions): void {
		const resource = 'file://' + this.getView(filePath)
		this._internalWin.loadURL(resource)
	}

	/**
	 * Occurs when the window is going to be closed.
	 * It’s emitted before the beforeunload and unload event of the DOM.
	 * Calling event.preventDefault() will cancel the close.
	 */
	protected onClosing(event: Electron.Event): void {
		// Stub
	}

	/**
	 * Occurs after the window has been closed.
	 * After you have received this event you should remove
	 * the reference to the window and avoid using it any more.
	 */
	protected onClosed(): void {
		// Stub
	}

	/**
	 * Occurs when the window loses focus.
	 */
	protected onBlur(): void {
		// Stub
	}

	/**
	 * Occurs when the window gains focus.
	 */
	protected onFocus(): void {
		// Stub
	}

	/**
	 * Occurs when the web page has been rendered
	 * (while not being shown) and window can be displayed without a visual flash.
	 */
	protected onShowing(): void {
		// Stub
	}

	/**
	 * Occurs after the window has been shown.
	 */
	protected onShown(): void {
		// Stub
	}

	/**
	 * Occurs when the spinner of the tab started spinning.
	 */
	protected onContentLoading(): void {
		// Stub
	}

	/**
	 * Occurs when the navigation is done, i.e. the spinner of the tab has stopped
     * spinning, and the onload event was dispatched.
	 */
	protected onContentLoaded(): void {
		// Stub
	}

	/**
	 * Occurs when the document in the given frame is loaded.
	 */
	protected onContentDomReady(event: Electron.Event) {
		// Stub
	}


	private handleEvents(): void {
		// Don't pass in a function like this: `this.on('close', this.onClosing.bind(this));`
		// Because `onClosing` can be overriden by children class.
		const win = this._internalWin
		win.on('close', (event: Electron.Event) => this.onClosing(event))
		win.on('closed', () => this.onClosed())
		win.on('blur', () => this.onBlur())
		win.on('focus', () => this.onFocus())
		win.on('ready-to-show', () => this.onShowing())
		win.on('show', () => this.onShown())
		win.webContents.on('did-start-loading', () => this.onContentLoading())
		win.webContents.on('did-finish-load', () => this.onContentLoaded())
		win.webContents.on('dom-ready', (event: Electron.Event) => this.onContentDomReady(event))
	}
}
