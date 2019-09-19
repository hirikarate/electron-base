"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const shortid = require("shortid");
const NOT_RENDERER_ERROR = 'This function is only available on renderer process!', NOT_MAIN_ERROR = 'This function is only available on main process!';
class CommunicationUtil {
    constructor() { }
    /**
     * Calls a method from main app class and waits for response, it will run on main process.
     * Can only send and receive serialziable JSON objects.
     * @param func Function name.
     * @param params List of parameters to send to the remote method.
     */
    static callAppSync(func, ...params) {
        this.assertRenderer();
        return electron_1.ipcRenderer.sendSync('sync-func-call-' + '__app__', { func, params });
    }
    /**
     * Calls a method from window class and waits for response, it will run on main process.
     * Can only send and receive serialziable JSON objects.
     * @param func Function name.
     * @param params List of parameters to send to the remote method.
     */
    static callWindowSync(func, ...params) {
        this.assertRenderer();
        const { rendererUtil } = require('./RendererUtil');
        const parentName = rendererUtil.parentWindow.name;
        return electron_1.ipcRenderer.sendSync('sync-func-call-' + parentName, { func, params });
    }
    /**
     * Calls a method from main app class, it will run on main process.
     * Can only send and receive serialziable JSON objects.
     * @param func Function name.
     * @param params List of parameters to send to the remote method.
     */
    static callApp(func, ...params) {
        this.assertRenderer();
        return this.callRemoteMain('__app__', func, ...params);
    }
    /**
     * Calls a method from window class, it will run on main process.
     * Can only send and receive serialziable JSON objects.
     * @param func Function name.
     * @param params List of parameters to send to the remote method.
     */
    static callWindow(func, ...params) {
        this.assertRenderer();
        const { rendererUtil } = require('./RendererUtil');
        const parentName = rendererUtil.parentWindow.name;
        return this.callRemoteMain(parentName, func, ...params);
    }
    /**
     * Calls a method from renderer process, it will run on renderern process.
     * Can only send and receive serialziable JSON objects.
     * @param browserWindow Function name.
     * @param params List of parameters to send to the remote method.
     */
    static callRenderer(browserWindow, func, ...params) {
        this.assertMain();
        return new Promise((resolve, reject) => {
            const responseTo = shortid.generate();
            electron_1.ipcMain['_callQueue'] = electron_1.ipcMain['_callQueue'] || {};
            electron_1.ipcMain['_callQueue'][responseTo] = { resolve, reject };
            browserWindow.webContents.send('renderer-func-call', {
                func,
                params,
                responseTo,
            });
        });
    }
    /**
     * Accepts incoming request to execute functions.
     * @param context The object to call functions from.
     */
    static startRendererCommunication(context) {
        this.assertRenderer();
        // Allow renderer process to call a function in main process
        // arg = {
        //    func: 'function name',
        //    params: ['array', 'of', 'parameters'],
        //    responseTo: <shortid token>
        // }
        electron_1.ipcRenderer.on('renderer-func-call', (event, arg) => {
            let result = null, error = null;
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
                    responseTo: arg.responseTo,
                });
            }
            else if (result && result.then) {
                result
                    .then((data) => {
                    event.sender.send('renderer-func-response', {
                        result: data,
                        error: null,
                        responseTo: arg.responseTo,
                    });
                })
                    .catch((err) => {
                    event.sender.send('renderer-func-response', {
                        result: null,
                        error: err + '',
                        responseTo: arg.responseTo,
                    });
                });
            }
        });
    }
    /**
     * Accepts incoming request to main app class.
     * @param context The object to call functions from.
     */
    static startAppCommunication(context) {
        this.startMainCommunication('__app__', context);
    }
    /**
     * Accepts incoming request to main app class.
     * @param windowName The window name.
     * @param context The object to call functions from.
     */
    static startWindowCommunication(windowName, context) {
        this.startMainCommunication(windowName, context);
    }
    /**
     * Accepts incoming request to execute functions.
     * @param id An unique identification string to send ipc message to.
     * @param context The object to call functions from.
     */
    static startMainCommunication(id, context) {
        this.assertMain();
        // Allow renderer process to call a function in main process
        // arg = {
        //    func: 'function name',
        //    params: ['array', 'of', 'parameters'],
        //    responseTo: 'response channel'
        // }
        electron_1.ipcMain.on('async-func-call-' + id, (event, arg) => {
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
            }
            else if (result && result.then) {
                result
                    .then((data) => {
                    event.sender.send(arg.responseTo, {
                        result: data,
                        error: null,
                    });
                })
                    .catch((err) => {
                    event.sender.send(arg.responseTo, {
                        result: null,
                        error: err,
                    });
                    console.error(err);
                });
            }
        });
        electron_1.ipcMain.on('sync-func-call-' + id, (event, arg) => {
            let result = null, error = null;
            try {
                result = context[arg.func].apply(context, arg.params);
            }
            catch (ex) {
                error = ex;
            }
            event.returnValue = {
                result: result,
                error: error,
            };
        });
        const rendererListener = electron_1.ipcMain.listeners('renderer-func-response');
        if (!rendererListener || !rendererListener.length) {
            electron_1.ipcMain.on('renderer-func-response', (event, arg) => {
                const queue = electron_1.ipcMain['_callQueue'] || {}, promise = queue[arg.responseTo];
                if (!promise) {
                    return;
                }
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
    static callRemoteMain(targetId, func, ...params) {
        return new Promise((resolve, reject) => {
            const responseTo = func + '-response';
            electron_1.ipcRenderer.once(responseTo, (event, arg) => {
                if (arg.error) {
                    return reject(arg.error);
                }
                resolve(arg.result);
            });
            electron_1.ipcRenderer.send('async-func-call-' + targetId, {
                func,
                params,
                responseTo,
            });
        });
    }
    static assertRenderer() {
        if (!electron_1.ipcRenderer) {
            throw new Error(NOT_RENDERER_ERROR);
        }
    }
    static assertMain() {
        if (!electron_1.ipcMain) {
            throw new Error(NOT_MAIN_ERROR);
        }
    }
}
exports.CommunicationUtil = CommunicationUtil;
//# sourceMappingURL=CommunicationUtil.js.map