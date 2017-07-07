"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eltr = require("electron");
const back_lib_common_util_1 = require("back-lib-common-util");
class ElectronWindowBase extends eltr.BrowserWindow {
    constructor(_name, options) {
        super(options);
        this._name = _name;
    }
    get name() {
        return this._name;
    }
    set app(app) {
        this._app = app;
    }
    clearCache() {
        return new Promise((resolve) => {
            this.webContents.session.clearCache(() => resolve);
        });
    }
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
            this.webContents.session.clearStorageData(options, resolve);
        });
    }
    onClosing(handler) {
        back_lib_common_util_1.Guard.assertDefined('handler', handler);
        this.on('close', handler);
    }
    onClosed(handler) {
        back_lib_common_util_1.Guard.assertDefined('handler', handler);
        this.on('closed', handler);
    }
    onBlur(handler) {
        back_lib_common_util_1.Guard.assertDefined('handler', handler);
        this.on('blur', handler);
    }
    onFocus(handler) {
        back_lib_common_util_1.Guard.assertDefined('handler', handler);
        this.on('focus', handler);
    }
    onShowing(handler) {
        back_lib_common_util_1.Guard.assertDefined('handler', handler);
        this.on('ready-to-show', handler);
    }
    onShown(handler) {
        back_lib_common_util_1.Guard.assertDefined('handler', handler);
        this.on('show', handler);
    }
    onContentLoading(handler) {
        back_lib_common_util_1.Guard.assertDefined('handler', handler);
        this.webContents.on('did-start-loading', handler);
    }
    onContentLoaded(handler) {
        back_lib_common_util_1.Guard.assertDefined('handler', handler);
        this.webContents.on('did-finish-load', handler);
    }
    onContentDomReady(handler) {
        back_lib_common_util_1.Guard.assertDefined('handler', handler);
        this.webContents.on('dom-ready', handler);
    }
}
exports.ElectronWindowBase = ElectronWindowBase;

//# sourceMappingURL=ElectronWindowBase.js.map
