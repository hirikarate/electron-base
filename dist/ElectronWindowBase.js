"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eltr = require("electron");
const path = require("path");
// export const BrowserWindow: typeof Electron.BrowserWindow = (eltr.ipcMain) ? eltr.BrowserWindow : null;
/**
 * Use this base class instead of `new BrowserWindow()`.
 * Note: Always call `super.on...()` when overriding
 * event methods such as `onContentLoading`, `onClosing` etc.
 */
class ElectronWindowBase {
    /**
     * @param _name Name of this window
     */
    constructor(_name, _options) {
        this._name = _name;
        this._options = _options;
        let options = this._options;
        this._triggerGlobalClose = (options == null || options.triggerGlobalClose == null || options.triggerGlobalClose === true);
        this._internalWin = new eltr.BrowserWindow(options);
        this._internalWin.setTitle(this._name);
        this.handleEvents();
    }
    /**
     * Gets this window's name.
     */
    get name() {
        return this._name;
    }
    /**
     * Gets parent app of this window.
     */
    get app() {
        return this._app;
    }
    /**
     * Sets parent app of this window.
     */
    set app(app) {
        this._app = app;
    }
    /**
     * Gets Electron native browser window.
     * This is a workaround until this issue is fixed: https://github.com/electron/electron/issues/10019
     */
    get native() {
        return this._internalWin;
    }
    /**
     * Gets option "triggerGlobalClose" value.
     */
    get triggerGlobalClose() {
        return this._triggerGlobalClose;
    }
    /**
     * Gets Electron native web contents.
     */
    get webContents() {
        return this._internalWin.webContents;
    }
    /**
     * Clears HTTP cache.
     */
    clearCache() {
        return new Promise((resolve) => {
            this._internalWin.webContents.session.clearCache(resolve);
        });
    }
    /**
     * Clears all types of storage, not including HTTP cache.
     */
    clearStorage() {
        return new Promise((resolve) => {
            let options = {
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
                origin: '*'
            };
            eltr.session.defaultSession.clearStorageData(options, resolve);
        });
    }
    /**
     * Try to close the window. This has the same effect as a user manually clicking
     * the close button of the window. The web page may cancel the close though. See
     * the close event.
     */
    close() {
        this.native.close();
    }
    /**
     * Forces closing the window, the unload and beforeunload event won't be emitted for
     * the web page, and close event will also not be emitted for this window, but it
     * guarantees the closed event will be emitted.
     */
    destroy() {
        this.native.destroy();
    }
    /**
     * Focuses on the window.
     */
    focus() {
        this.native.focus();
    }
    isFocused() {
        return this.native.isFocused();
    }
    isFullScreen() {
        return this.native.isFullScreen();
    }
    isKiosk() {
        return this.native.isKiosk();
    }
    isModal() {
        return this.native.isModal();
    }
    /**
     * Maximizes the window. This will also show (but not focus) the window if it isn't
     * being displayed already.
     */
    maximize() {
        this.native.maximize();
    }
    /**
     * Minimizes the window. On some platforms the minimized window will be shown in
     * the Dock.
     */
    minimize() {
        this.native.minimize();
    }
    /**
     * Reloads the current web page.
     */
    reload() {
        this.native.reload();
    }
    /**
     * Restores the window from minimized state to its previous state.
     */
    restore() {
        this.native.restore();
    }
    /**
     * Enters or leaves the kiosk mode.
     */
    setKiosk(flag) {
        this.native.setKiosk(flag);
    }
    /**
     * Displays a modal dialog that tells user something.
     * This is similar to `alert()` function.
     */
    showInfoBox(title, content, detail) {
        return this.showMessageBox({
            buttons: ['OK'],
            message: content,
            title,
            detail,
            type: 'info',
            noLink: true
        }).then((answer) => {
            return;
        });
    }
    /**
     * Displays a modal dialog that asks user to choose Yes or No.
     * This is similar to `confirm()` function.
     */
    showConfirmBox(title, content, detail) {
        return this.showMessageBox({
            buttons: ['Yes', 'No'],
            message: content,
            title,
            detail,
            defaultId: 1,
            cancelId: 1,
            type: 'warning',
            noLink: true
        }).then((answer) => {
            return (answer == 0);
        });
    }
    /**
     * Displays a modal dialog that shows an error message.
     */
    showErrorBox(title, content, detail) {
        return this.showMessageBox({
            buttons: ['OK'],
            message: content,
            title,
            detail,
            type: 'error',
        }).then((answer) => {
            return;
        });
    }
    /**
     * Shows a dialog to select folders to open.
     * @return A promise to resolve to an array of selected paths, and to null if user cancels the dialog.
     */
    showOpenDialog(options) {
        return new Promise((resolve, reject) => {
            eltr.dialog.showOpenDialog(this.native, options, (filePaths) => {
                // When user closes dialog, `filePaths.length == 1, `filePaths[0]` == undefined
                if (filePaths && filePaths.length && filePaths[0]) {
                    resolve(filePaths);
                    return;
                }
                resolve(null);
            });
        });
    }
    /**
     * Shows a dialog to select a file to save.
     * @return A promise to resolve to the selected path, and to null if user cancels the dialog.
     */
    showSaveDialog(options) {
        return new Promise((resolve, reject) => {
            eltr.dialog.showSaveDialog(this.native, options, resolve);
        });
    }
    /**
     * Shows a message dialog.
     * @return A promise to resolve to:
     * 	`response` is index of the clicked button;
     * 	`checkboxChecked` tells whether user selects the checkbox (if visible)
     */
    showMessageBox(options) {
        return new Promise((resolve, reject) => {
            eltr.dialog.showMessageBox(this.native, options, resolve);
        });
    }
    /**
     * Unmaximizes the window.
     */
    unmaximize() {
        this.native.unmaximize();
    }
    /**
     * Sets whether the window should be in fullscreen mode.
     */
    setFullScreen(flag) {
        this.native.setFullScreen(flag);
    }
    /**
     * Builds and gets absolute path from specified file path.
     * @param filePath Relative path to .html file.
     */
    getView(filePath) {
        return path.join(this._app.viewRoot, filePath);
    }
    /**
     * Loads view from specified file path.
     * @param filePath Relative path to .html file.
     */
    loadView(filePath, options) {
        let resource = 'file://' + this.getView(filePath);
        this._internalWin.loadURL(resource);
    }
    /**
     * Occurs when the window is going to be closed.
     * It’s emitted before the beforeunload and unload event of the DOM.
     * Calling event.preventDefault() will cancel the close.
     */
    onClosing(event) {
    }
    /**
     * Occurs after the window has been closed.
     * After you have received this event you should remove
     * the reference to the window and avoid using it any more.
     */
    onClosed() {
    }
    /**
     * Occurs when the window loses focus.
     */
    onBlur() {
    }
    /**
     * Occurs when the window gains focus.
     */
    onFocus() {
    }
    /**
     * Occurs when the web page has been rendered
     * (while not being shown) and window can be displayed without a visual flash.
     */
    onShowing() {
    }
    /**
     * Occurs after the window has been shown.
     */
    onShown() {
    }
    /**
     * Occurs when the spinner of the tab started spinning.
     */
    onContentLoading() {
    }
    /**
     * Occurs when the navigation is done, i.e. the spinner of the tab has stopped
     * spinning, and the onload event was dispatched.
     */
    onContentLoaded() {
    }
    /**
     * Occurs when the document in the given frame is loaded.
     */
    onContentDomReady(event) {
    }
    handleEvents() {
        // Don't pass in a function like this: `this.on('close', this.onClosing.bind(this));`
        // Because `onClosing` can be overriden by children class.
        let win = this._internalWin;
        win.on('close', (event) => this.onClosing(event));
        win.on('closed', () => this.onClosed());
        win.on('blur', () => this.onBlur());
        win.on('focus', () => this.onFocus());
        win.on('ready-to-show', () => this.onShowing());
        win.on('show', () => this.onShown());
        win.webContents.on('did-start-loading', () => this.onContentLoading());
        win.webContents.on('did-finish-load', () => this.onContentLoaded());
        win.webContents.on('dom-ready', (event) => this.onContentDomReady(event));
    }
}
exports.ElectronWindowBase = ElectronWindowBase;

//# sourceMappingURL=ElectronWindowBase.js.map
