"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const RendererLogger_1 = require("./RendererLogger");
const NOT_AVAIL_ERROR = 'This function is only available on renderer process!', NOT_PROMISE_ERROR = 'This function does not return a Promise!';
class RendererUtil {
    constructor() {
        if (!electron_1.ipcRenderer) {
            throw NOT_AVAIL_ERROR;
        }
        this._rendererLogger = new RendererLogger_1.RendererLogger(this.mainApp.logger);
    }
    get logger() {
        return this._rendererLogger;
    }
    /**
     * Gets instance of main app class.
     */
    get mainApp() {
        return (electron_1.ipcRenderer != null
            ? electron_1.remote.getGlobal('app')
            : null);
    }
    /**
     * Gets instance of parent window of this renderer process.
     */
    get parentWindow() {
        let mainApp = this.mainApp;
        return (electron_1.ipcRenderer != null && mainApp != null
            ? mainApp.findWindow(electron_1.remote.getCurrentWindow()['name'])
            : null);
    }
    /**
     * Calls a method from app class asynchronously, it will run on main process.
     * Unlike `callIpc`, this method can send and receive all types of JS objects.
     * @param func Function name.
     * @param params List of parameters to send to the remote method.
     */
    callRemoteMain(func, ...params) {
        let mainApp = this.mainApp, result = mainApp[func].apply(mainApp, params);
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
    callRemoteMainSync(func, ...params) {
        let mainApp = this.mainApp;
        return mainApp[func].apply(mainApp, params);
    }
    /**
     * Calls a method from parent window asynchronously, it will run on main process.
     * Unlike `callIpc`, this method can send and receive all types of JS objects.
     * @param func Function name.
     * @param params List of parameters to send to the remote method.
     */
    callRemoteWindow(func, ...params) {
        let parentWindow = this.parentWindow, result = parentWindow[func].apply(parentWindow, params);
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
    callRemoteWindowSync(func, ...params) {
        let parentWindow = this.parentWindow;
        return parentWindow[func].apply(parentWindow, params);
    }
    /**
     * @deprecated
     * Calls a function from main process asynchronously with inter-process message.
     * Can only send and receive serialziable JSON objects.
     * @param windowName The window name to call functions from. If null, call function in app class.
     * @param func Function name.
     * @param params List of parameters to send to the function.
     */
    callIpc(windowName, func, ...params) {
        return new Promise((resolve, reject) => {
            let responseChannel = func + '-response';
            electron_1.ipcRenderer.once(responseChannel, (event, arg) => {
                if (!arg.error) {
                    reject(arg.error);
                    return;
                }
                resolve(arg.result);
            });
            electron_1.ipcRenderer.send('async-func-call', {
                func: func,
                params: Array.prototype.slice.call(arguments, 3),
                response: responseChannel,
                target: windowName
            });
        });
    }
    /**
     * @deprecated
     * Calls a function from main process and waits for it to complete.
     * Can only send and receive serialziable JSON objects.
     * @param windowName The window name to call functions from. If null, call function in app class.
     * @param func Function name.
     * @param params List of parameters to send to the function.
     */
    callIpcSync(windowName, func, ...params) {
        return electron_1.ipcRenderer.sendSync('sync-func-call', {
            func: func,
            params: Array.prototype.slice.call(arguments, 2),
            target: windowName
        });
    }
    addGlobal(name, value) {
        if (global[name] !== undefined) {
            return;
        }
        Object.defineProperty(global, name, {
            value: value,
            writable: false // Add read-only property
        });
    }
    /**
     * Copies global vars from main process to renderer process.
     */
    shareGlobalVars() {
        this.addGlobal('appRoot', electron_1.remote.getGlobal('appRoot'));
        this.addGlobal('webRoot', electron_1.remote.getGlobal('webRoot'));
        this.addGlobal('windowName', this.parentWindow.name);
        return this;
    }
}
exports.RendererUtil = RendererUtil;
// Only export an instance if called on renderer process.
exports.rendererUtil = (electron_1.ipcRenderer != null
    ? new RendererUtil()['shareGlobalVars']() // Intentionally call private method
    : null);

//# sourceMappingURL=RendererUtil.js.map
