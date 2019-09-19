"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const RendererLogger_1 = require("./RendererLogger");
const NOT_AVAIL_ERROR = 'This function is only available on renderer process!';
class RendererUtil {
    constructor() {
        if (!electron_1.ipcRenderer) {
            throw NOT_AVAIL_ERROR;
        }
        this._mainApp = (electron_1.ipcRenderer != null
            ? electron_1.remote.getGlobal('app')
            : null);
        this._parentWindow = (electron_1.ipcRenderer != null && this._mainApp != null
            ? this._mainApp.findWindow(electron_1.remote.getCurrentWindow()['name'])
            : null);
        this._rendererLogger = new RendererLogger_1.RendererLogger(this._mainApp.logger);
    }
    get logger() {
        return this._rendererLogger;
    }
    /**
     * Gets instance of main app class.
     */
    get mainApp() {
        return this._mainApp;
    }
    /**
     * Gets instance of parent window of this renderer process.
     */
    get parentWindow() {
        return this._parentWindow;
    }
    addGlobal(name, value) {
        if (global[name] !== undefined) {
            return;
        }
        Object.defineProperty(global, name, {
            value: value,
            writable: false,
        });
    }
    /**
     * Copies global vars from main process to renderer process.
     */
    shareGlobalVars() {
        this.addGlobal('appDiskRoot', electron_1.remote.getGlobal('appDiskRoot'));
        this.addGlobal('appCodeRoot', electron_1.remote.getGlobal('appCodeRoot'));
        this.addGlobal('webRoot', electron_1.remote.getGlobal('webRoot'));
        this.addGlobal('packMode', this._mainApp.options.packMode);
        this.addGlobal('isDebug', this._mainApp.isDebug);
        this.addGlobal('windowName', this._parentWindow.name);
        return this;
    }
}
exports.RendererUtil = RendererUtil;
// Only export an instance if called on renderer process.
exports.rendererUtil = (electron_1.ipcRenderer != null
    ? new RendererUtil()['shareGlobalVars']() // Intentionally call private method
    : null);
//# sourceMappingURL=RendererUtil.js.map