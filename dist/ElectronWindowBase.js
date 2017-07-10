"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eltr = require("electron");
const path = require("path");
exports.BrowserWindow = (eltr.ipcMain) ? eltr.BrowserWindow : null;
/**
 * Use this base class instead of `new BrowserWindow()`.
 * Note: Always call `super.on...()` when overriding
 * event methods such as `onContentLoading`, `onClosing` etc.
 */
class ElectronWindowBase extends exports.BrowserWindow {
    /**
     * @param _name Name of this window
     */
    constructor(_name, options) {
        super(options);
        this._name = _name;
        this._triggerGlobalClose = (options.triggerGlobalClose == null ? true : false);
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
     * Gets option "triggerGlobalClose" value.
     */
    get triggerGlobalClose() {
        return this._triggerGlobalClose;
    }
    /**
     * Clears HTTP cache.
     */
    clearCache() {
        return new Promise((resolve) => {
            this.webContents.session.clearCache(resolve);
        });
    }
    /**
     * Clears all types of storage, including HTTP cache.
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
        this.loadURL(resource);
    }
    /**
     * Occurs when the window is going to be closed.
     * It’s emitted before the beforeunload and unload event of the DOM.
     * Calling event.preventDefault() will cancel the close.
     */
    onClosing() {
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
        this.webContents.executeJavaScript(`
			if (global) {
				global.windowName = '${this.name}';
				global.appRoot = '${global.appRoot}';
				global.webRoot = '${global.webRoot}';
			}
		`);
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
        this.on('close', () => this.onClosing());
        this.on('closed', () => this.onClosed());
        this.on('blur', () => this.onBlur());
        this.on('focus', () => this.onFocus());
        this.on('ready-to-show', () => this.onShowing());
        this.on('show', () => this.onShown());
        this.webContents.on('did-start-loading', () => this.onContentLoading());
        this.webContents.on('did-finish-load', () => this.onContentLoaded());
        this.webContents.on('dom-ready', (event) => this.onContentDomReady(event));
    }
}
exports.ElectronWindowBase = ElectronWindowBase;

//# sourceMappingURL=ElectronWindowBase.js.map
