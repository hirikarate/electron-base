"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const NOT_AVAIL_ERROR = 'This function is only available on renderer process!', NOT_PROMISE_ERROR = 'This function does not return a Promise!';
exports.parentWindow = (electron_1.ipcRenderer != null
    ? electron_1.remote.getCurrentWindow()
    : null);
exports.mainApp = (electron_1.ipcRenderer != null
    ? electron_1.remote.getGlobal('app')
    : null);
let addGlobal = function (name, value) {
    if (global[name] !== undefined) {
        return;
    }
    Object.defineProperty(global, name, {
        value: value,
        writable: false // Add read-only property
    });
};
class RendererUtil {
    /**
     * Copies global vars from main process to renderer process.
     */
    static shareGlobalVars() {
        if (!electron_1.ipcRenderer) {
            throw NOT_AVAIL_ERROR;
        }
        addGlobal('appRoot', electron_1.remote.getGlobal('appRoot'));
        addGlobal('webRoot', electron_1.remote.getGlobal('webRoot'));
        addGlobal('windowName', exports.parentWindow.name);
    }
    /**
     * Calls a method from app class asynchronously, it will run on main process.
     * Unlike `callIpc`, this method can send and receive all types of JS objects.
     * @param func Function name.
     * @param params List of parameters to send to the remote method.
     */
    static callRemoteMain(func, ...params) {
        if (!electron_1.ipcRenderer) {
            throw NOT_AVAIL_ERROR;
        }
        let result = exports.mainApp[func].apply(exports.mainApp, params);
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
    static callRemoteMainSync(func, ...params) {
        if (!electron_1.ipcRenderer) {
            throw NOT_AVAIL_ERROR;
        }
        return exports.mainApp[func].apply(exports.mainApp, params);
    }
    /**
     * Calls a method from parent window asynchronously, it will run on main process.
     * Unlike `callIpc`, this method can send and receive all types of JS objects.
     * @param func Function name.
     * @param params List of parameters to send to the remote method.
     */
    static callRemoteWindow(func, ...params) {
        if (!electron_1.ipcRenderer) {
            throw NOT_AVAIL_ERROR;
        }
        let result = exports.parentWindow[func].apply(exports.parentWindow, params);
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
    static callRemoteWindowSync(func, ...params) {
        if (!electron_1.ipcRenderer) {
            throw NOT_AVAIL_ERROR;
        }
        return exports.parentWindow[func].apply(exports.parentWindow, params);
    }
    /**
     * Calls a function from main process asynchronously with inter-process message.
     * Can only send and receive serialziable JSON objects.
     * @param windowName The window name to call functions from. If null, call function in app class.
     * @param func Function name.
     * @param params List of parameters to send to the function.
     */
    static callIpc(windowName, func, ...params) {
        if (!electron_1.ipcRenderer) {
            throw NOT_AVAIL_ERROR;
        }
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
     * Calls a function from main process and waits for it to complete.
     * Can only send and receive serialziable JSON objects.
     * @param windowName The window name to call functions from. If null, call function in app class.
     * @param func Function name.
     * @param params List of parameters to send to the function.
     */
    static callIpcSync(windowName, func, ...params) {
        if (!electron_1.ipcRenderer) {
            throw NOT_AVAIL_ERROR;
        }
        return electron_1.ipcRenderer.sendSync('sync-func-call', {
            func: func,
            params: Array.prototype.slice.call(arguments, 2),
            target: windowName
        });
    }
}
exports.RendererUtil = RendererUtil;

//# sourceMappingURL=RendererUtil.js.map
