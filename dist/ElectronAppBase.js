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
// If this is main process
if (eltr.ipcMain) {
    Object.defineProperty(global, 'appRoot', {
        value: process.cwd(),
        writable: false // Add read-only property
    });
}
class ElectronAppBase {
    constructor(_options = {}) {
        this._options = _options;
        this._core = eltr.app;
        this._ipcMain = eltr.ipcMain;
        this._windows = new Map();
        this._event = new events_1.EventEmitter();
        this._quitHandlers = [];
        this._isClosingAll = false;
        this._viewRoot = `${global.appRoot}/views/`;
        let defaultOpts = {
            globalClose: false,
            logFilePath: path.join(global.appRoot, 'logs'),
            quitWhenAllWindowsClosed: true,
            serveStaticFiles: true,
            staticFileDomain: 'localhost',
            staticFilePort: 30000
        };
        this._options = Object.assign(defaultOpts, this._options);
        this.initLogger();
        global.app = this;
    }
    /**
     * Gets absolute path to folder that contains html files.
     */
    get viewRoot() {
        return this._viewRoot;
    }
    /**
     * Gets Electron application instance.
     */
    get core() {
        return this._core;
    }
    /**
     * Gets IPC of main process.
    */
    get ipcMain() {
        return this._ipcMain;
    }
    /**
     * Starts application
     */
    start() {
        this.onStarting();
        this.handleEvents();
        let startPromise = new Promise(resolve => {
            // Only use this when your VGA is blacklisted by Chrome. Check chrome://gpu to know.
            this._core.commandLine.appendSwitch('ignore-gpu-blacklist', 'true');
            this.startCommunication();
            resolve();
        });
        if (this._options.serveStaticFiles) {
            startPromise = startPromise.then(() => this.serveStaticFiles());
        }
        this._event.once('app-ready', () => {
            startPromise.then(() => this.onStarted());
        });
    }
    /**
     * Writes logging message.
     */
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
    /**
     * Attempts to quit this application, however one of the quit handlers can
     * prevent this process if `force` is false.
     * @param force Quit the app regardless somebody wants to prevent.
     * @return If quit process is successful or not.
     */
    quit(force = false) {
        let handlerPromises = this._quitHandlers.map(handler => handler(force));
        return Promise.all(handlerPromises).then(results => {
            // If at least one of the results is "false", cancel quit process.
            let cancel = results.reduce((prev, r) => r && prev, true);
            // If the app is forced to quit, or if nobody prevents it from quitting.
            if (force || !cancel) {
                this._core.quit();
                return true;
            }
            return false;
        });
    }
    /**
     * Stores this window reference and adds neccessary events to manage it.
     */
    addWindow(window) {
        window.app = this;
        this._windows.set(window.name, window);
        window.webContents.on('did-start-loading', () => this.processEmbededServerUrl(window));
        window.on('closed', () => {
            this._windows.delete(window.name);
            if (!window.triggerGlobalClose) {
                return;
            }
            this.tryCloseAllWindows();
        });
        window.start();
        return window;
    }
    /**
     * Reloads window with specified `name`, or reloads all if no name is given.
     * @param name If specified, reload window with this name.
     */
    reload(name) {
        if (name && this._windows.has(name)) {
            this._windows.get(name).reload();
            return;
        }
        this._windows.forEach(win => win.reload());
    }
    /**
     * Enables full screen for window with specified `name`, or sets full screen for all if no name is given.
     * @param name If specified, reload window with this name.
     */
    goFullScreen(name) {
        if (name && this._windows.has(name)) {
            this._windows.get(name).setFullScreen(true);
            return;
        }
        this._windows.forEach(win => win.setFullScreen(true));
    }
    /**
     * Adds a listener to call before quit.
     * @param handler If this handler resolves to falsey value, it cancels quit process.
     */
    addQuitListener(handler) {
        back_lib_common_util_1.Guard.assertDefined('handler', handler);
        this._quitHandlers.push(handler);
    }
    /**
     * Clears HTTP cache.
     */
    clearCache() {
        return new Promise((resolve) => {
            eltr.session.defaultSession.clearCache(resolve);
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
     * Gets all display screens available on this machine.
     */
    getAllDisplays() {
        return eltr.screen.getAllDisplays();
    }
    /**
     * Gets the 2nd display screen (if any) on this machine.
     * If you want to get more displays, use `getAllDisplays`.
     * @return A display object, or null if there is only one display available.
     */
    getSecondDisplay() {
        let displays = this.getAllDisplays(), externalDisplay = null;
        for (let i in displays) {
            if (displays[i].bounds.x != 0 || displays[i].bounds.y != 0) {
                externalDisplay = displays[i];
                break;
            }
        }
        return externalDisplay;
    }
    /**
     * Executes an OS command.
     */
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
    /**
     * Occurs after application window is focused by user.
     */
    onActivated() {
    }
    /**
     * Occurs after all windows have been closed.
     */
    onAllWindowsClosed() {
    }
    /**
     * Occurs before application creates any windows.
     */
    onStarting() {
    }
    /**
     * Occurs after application has created all windows.
     */
    onStarted() {
    }
    /**
     * Adds a listener to call when an error occurs.
     */
    onError(message) {
        this.log('error', message);
    }
    tryCloseAllWindows() {
        if (!this._options.globalClose || this._isClosingAll) {
            return;
        }
        // Turn on flag to prevent this method from being called multiple times by other window's 'closed' event.
        this._isClosingAll = true;
        this._windows.forEach((win) => {
            win.close();
            this._windows.delete(win.name);
        });
    }
    handleEvents() {
        let app = this._core;
        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.
        app.on('ready', () => {
            this._event.emit('app-ready');
        });
        // Quit when all windows are closed.
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
                new (winston.transports.Console)({
                    level: 'silly'
                }),
                new (winston.transports.File)({
                    filename: path.join(logPath, 'error.txt'),
                    level: 'warn'
                })
            ]
        });
    }
    processEmbededServerUrl(win) {
        /**
         * Transform resource file URLs
         */
        const filter = {
            urls: []
        };
        win.webContents.session.webRequest.onBeforeRequest(filter, (detail, cb) => {
            //*
            const ROOT_PATH = '~/';
            let { url } = detail, pos = url.indexOf(ROOT_PATH), redirectURL = null;
            if (pos >= 0) {
                url = url.substring(pos + ROOT_PATH.length);
                // Map from "~/" to "localhost/""
                redirectURL = `${global.webRoot}/${url}`;
            }
            //*/
            // this.log('debug', 'Old URL: ' + url);
            // this.log('debug', 'New URL: ' + redirectURL);
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
                // Add read-only property
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
        // Allow renderer process to call a function in main process
        // arg = {
        // 		func: 'function name',
        //		params: ['array', 'of', 'parameters'],
        //		response: 'response channel'
        // }
        this._ipcMain.on('async-func-call', (event, arg) => {
            let result = null, error = null, windowName = arg.target;
            try {
                // result = this[arg.func].apply(this, arg.params);
                if (!windowName) {
                    // Call app class' method
                    result = this[arg.func].apply(this, arg.params);
                }
                else if (this._windows.has(windowName)) {
                    // Call method from this specified window
                    let context = this._windows.get(windowName);
                    result = context[arg.func].apply(context, arg.params);
                }
                else {
                    throw 'Invalid target';
                }
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
            let result = null, error = null, windowName = arg.target;
            try {
                if (!windowName) {
                    // Call app class' method
                    result = this[arg.func].apply(this, arg.params);
                }
                else if (this._windows.has(windowName)) {
                    // Call method from this specified window
                    let context = this._windows.get(windowName);
                    result = context[arg.func].apply(context, arg.params);
                }
                else {
                    throw 'Invalid target';
                }
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
