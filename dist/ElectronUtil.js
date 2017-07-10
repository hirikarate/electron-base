"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const ERROR_MSG = 'This function is only available on renderer process';
/**
 * Returns a function that always as `windowName` passed as first param,
 * other params are the same as `func`.
 */
let delegate = function (windowName, func) {
    return function () {
        let argsWithoutWinName = Array.prototype.slice.call(arguments, 1), args = [windowName, ...argsWithoutWinName];
        func.apply(null, args);
    };
};
class ElectronUtil {
    /**
     * Assigns functions in this class to `global` variable.
     * @param windowName The window name to call functions from.
     */
    static registerGlobalFunctions(windowName) {
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
    static callMain(windowName, func, callback, ...params) {
        if (!electron_1.ipcRenderer) {
            throw ERROR_MSG;
        }
        let responseChannel = func + '-response';
        electron_1.ipcRenderer.once(responseChannel, (event, arg) => {
            if (!callback) {
                return;
            }
            callback(arg.error, arg.result);
        });
        electron_1.ipcRenderer.send('async-func-call', {
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
    static callMainSync(windowName, func, ...params) {
        if (!electron_1.ipcRenderer) {
            throw ERROR_MSG;
        }
        return electron_1.ipcRenderer.sendSync('sync-func-call', {
            func: func,
            params: Array.prototype.slice.call(arguments, 2),
            target: windowName
        });
    }
}
exports.ElectronUtil = ElectronUtil;

//# sourceMappingURL=ElectronUtil.js.map
