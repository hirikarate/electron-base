"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(global, 'appRoot', {
    value: process.cwd(),
    writable: false
});
const electron_1 = require("electron");
const ERROR_MSG = 'This function is only available on renderer process';
class ElectronUtil {
    static callMain(func, callback, ...params) {
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
            params: Array.prototype.slice.call(arguments, 2),
            response: responseChannel
        });
    }
    static callMainSync(func, params) {
        if (!electron_1.ipcRenderer) {
            throw ERROR_MSG;
        }
        return electron_1.ipcRenderer.sendSync('sync-func-call', {
            func: func,
            params: Array.prototype.slice.call(arguments, 1)
        });
    }
}
exports.ElectronUtil = ElectronUtil;
if (electron_1.ipcRenderer) {
    global['appRoot'] = ElectronUtil.callMainSync('appRoot').result;
    global['webRoot'] = ElectronUtil.callMainSync('webRoot').result;
}

//# sourceMappingURL=ElectronUtil.js.map
