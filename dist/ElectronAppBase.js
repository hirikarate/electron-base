"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eltr = require("electron");
const events_1 = require("events");
const fs = require("fs");
const http = require("http");
const path = require("path");
const execSyncToBuffer = require("sync-exec");
const back_lib_common_util_1 = require("back-lib-common-util");
const tinyCdn = require('tiny-cdn');
const winston = require("winston");
require("./ElectronUtil");
class ElectronAppBase {
    constructor(_options = {}) {
        this._options = _options;
        this._core = eltr.app;
        this._ipcMain = eltr.ipcMain;
        this._windows = new Map();
        this._event = new events_1.EventEmitter();
        this._quitHandlers = [];
        let defaultOpts = {
            logFilePath: path.join(global.appRoot, 'logs'),
            quitWhenAllWindowsClosed: true,
            serveStaticFiles: true,
            staticFileDomain: 'localhost',
            staticFilePort: 30000
        };
        this._options = Object.assign(defaultOpts, this._options);
    }
    get core() {
        return this._core;
    }
    get ipcMain() {
        return this._ipcMain;
    }
    appRoot() {
        return global.appRoot;
    }
    webRoot() {
        return global.webRoot;
    }
    start() {
        this.onStarting();
        this.handleEvents();
        let startPromise = new Promise(resolve => {
            this._core.commandLine.appendSwitch('ignore-gpu-blacklist', 'true');
            this.initLogger();
            resolve();
        });
        if (this._options.serveStaticFiles) {
            startPromise = startPromise.then(() => this.serveStaticFiles());
        }
        this._event.once('app-ready', () => {
            startPromise.then(() => this.onStarted());
        });
    }
    log(level, message) {
        return new Promise((resolve, reject) => {
            this._logger.log(level, message, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
    quit(force = false) {
        let handlerPromises = this._quitHandlers.map(handler => handler(force));
        return Promise.all(handlerPromises).then(results => {
            let cancel = results.reduce((prev, r) => r && prev, true);
            if (force || !cancel) {
                this._core.quit();
                return true;
            }
            return false;
        });
    }
    addWindow(window) {
        window.app = this.core;
        this._windows.set(window.name, window);
        window.onContentLoading(() => this.processEmbededServerUrl(window));
        window.onClosed(() => {
            this._windows.delete(window.name);
        });
        window.start();
        return window;
    }
    reload(name) {
        if (name && this._windows.has(name)) {
            this._windows.get(name).reload();
            return;
        }
        this._windows.forEach(win => win.reload());
    }
    goFullScreen(name) {
        if (name && this._windows.has(name)) {
            this._windows.get(name).setFullScreen(true);
            return;
        }
        this._windows.forEach(win => win.setFullScreen(true));
    }
    addQuitListener(handler) {
        back_lib_common_util_1.Guard.assertDefined('handler', handler);
        this._quitHandlers.push(handler);
    }
    execCmd(command, options) {
        options = options || {};
        let results = execSyncToBuffer(command, options);
        if (!results.status) {
            return results.stdout;
        }
        throw {
            stderr: results.stderr
        };
    }
    onActivated() {
    }
    onAllWindowsClosed() {
    }
    onStarting() {
    }
    onStarted() {
    }
    onError(message) {
        this.log('error', message);
    }
    handleEvents() {
        let app = this._core;
        app.on('ready', () => {
            this._event.emit('app-ready');
        });
        app.on('window-all-closed', () => {
            this.onAllWindowsClosed();
            if (this._options.quitWhenAllWindowsClosed) {
                this._core.quit();
            }
        });
        app.on('activate', () => {
            this.onActivated();
        });
    }
    initLogger() {
        let logPath = this._options.logFilePath;
        if (!fs.existsSync(logPath)) {
            fs.mkdirSync(logPath);
        }
        this._logger = new winston.Logger({
            transports: [
                new (winston.transports.Console)(),
                new (winston.transports.File)({
                    filename: path.join(logPath, 'error.txt'),
                    level: 'warn'
                })
            ]
        });
    }
    processEmbededServerUrl(win) {
        const filter = {
            urls: []
        };
        win.webContents.session.webRequest.onBeforeRequest(filter, (detail, cb) => {
            const ROOT_PATH = '~/';
            let { url } = detail, pos = url.indexOf(ROOT_PATH), redirectURL = null;
            if (pos >= 0) {
                url = url.substring(pos + ROOT_PATH.length);
                redirectURL = `${this.webRoot()}/${url}`;
            }
            cb({ redirectURL });
        });
    }
    serveStaticFiles() {
        const CACHE_PATH = `${global.appRoot}/assets/tiny-cdn-cache`;
        let domain = this._options.staticFileDomain || 'localhost', port = this._options.staticFilePort || 30000;
        if (!fs.existsSync(CACHE_PATH)) {
            fs.mkdirSync(CACHE_PATH);
        }
        return new Promise(resolve => {
            http.createServer(tinyCdn.create({
                source: global.appRoot,
                dest: CACHE_PATH,
            }))
                .listen(port, () => {
                Object.defineProperty(global, 'webRoot', {
                    value: `http://${domain}:${port}`,
                    writable: false
                });
                resolve();
            })
                .on('error', (err) => this._event.emit('error', err));
        })
            .catch(err => {
            this._event.emit('error', err);
            process.exit();
        });
    }
    startCommunication() {
        this._ipcMain.on('async-func-call', (event, arg) => {
            let result = null, error = null;
            try {
                result = this[arg.func].apply(this, arg.params);
            }
            catch (ex) {
                error = ex;
            }
            if (!result || (result && !result.then)) {
                event.sender.send(arg.response, {
                    result: result,
                    error: error
                });
            }
            else if (result && result.then) {
                result
                    .then(data => {
                    event.sender.send(arg.response, {
                        result: data,
                        error: null
                    });
                })
                    .catch(err => {
                    event.sender.send(arg.response, {
                        result: null,
                        error: err
                    });
                });
            }
        });
        this._ipcMain.on('sync-func-call', (event, arg) => {
            let result = null, error = null;
            try {
                result = this[arg.func].apply(this, arg.params);
            }
            catch (ex) {
                error = ex;
            }
            event.returnValue = {
                result: result,
                error: error
            };
        });
    }
}
exports.ElectronAppBase = ElectronAppBase;

//# sourceMappingURL=ElectronAppBase.js.map
