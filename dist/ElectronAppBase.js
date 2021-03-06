"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eltr = require("electron");
const events_1 = require("events");
const fs = require("fs");
const http = require("http");
const path = require("path");
const child_process_1 = require("child_process");
const tinyCdn = require('tiny-cdn');
const MainLogger_1 = require("./MainLogger");
const CommunicationUtil_1 = require("./CommunicationUtil");
var AppStatus;
(function (AppStatus) {
    AppStatus[AppStatus["NotReady"] = 0] = "NotReady";
    AppStatus[AppStatus["Ready"] = 1] = "Ready";
    AppStatus[AppStatus["Started"] = 2] = "Started";
})(AppStatus || (AppStatus = {}));
class ElectronAppBase {
    constructor(_options = {}) {
        this._options = _options;
        this.initOptions(_options);
        this._logger = this.createLogger();
        this.initAppRoot();
        this._core = eltr.app;
        this._ipcMain = eltr.ipcMain;
        this._windows = new Map();
        this._event = new events_1.EventEmitter();
        this._quitHandlers = [];
        this._isClosingAll = false;
        this._viewRoot = `${global.appCodeRoot}/views/`;
        this._status = AppStatus.NotReady;
        global.app = this;
    }
    /**
     * Gets logger.
     */
    get logger() {
        return this._logger;
    }
    /**
     * Gets application settings.
     */
    get options() {
        return this._options;
    }
    /**
     * Gets absolute path to folder that contains html files.
     */
    get viewRoot() {
        return this._viewRoot;
    }
    /**
     * Gets all windows.
     */
    get windows() {
        return Array.from(this._windows.values());
    }
    /**
     * Gets Electron application instance.
     */
    get core() {
        return this._core;
    }
    /**
     * Gets Electron dialog instance.
     */
    get dialog() {
        return eltr.dialog;
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
        if (this.isDebug) {
            this.logger.debug('App is starting!');
        }
        process
            .on('unhandledRejection', (reason, p) => {
            this.onError(reason);
        })
            .on('uncaughtException', err => {
            this.onError(err);
        });
        this.onStarting();
        this.handleEvents();
        let startPromise = new Promise(resolve => {
            // Only use this when your VGA is blacklisted by Chrome. Check chrome://gpu to know.
            this._core.commandLine.appendSwitch('ignore-gpu-blacklist', 'true');
            CommunicationUtil_1.CommunicationUtil.startAppCommunication(this);
            resolve();
        });
        if (this._options.serveStaticFiles) {
            startPromise = startPromise.then(() => this.serveStaticFiles());
        }
        startPromise = startPromise.catch(err => this.onError(err));
        const onAppReady = () => {
            startPromise.then(() => {
                this._status = AppStatus.Started;
                if (this.isDebug) {
                    this.logger.debug('Calling onStarted event...');
                }
                this.onStarted();
                if (this.isDebug) {
                    this.logger.debug('App has started!');
                }
                startPromise = null;
                this._event = null;
            });
        };
        this._event.once('app-ready', onAppReady);
        if (this._status == AppStatus.Ready) {
            onAppReady.apply(this);
        }
    }
    /**
     * Attempts to quit this application, however one of the quit handlers can
     * prevent this process if `force` is false.
     * @param force Quit the app regardless somebody wants to prevent.
     * @return If quit process is successful or not.
     */
    quit(force = false) {
        if (this.isDebug) {
            this.logger.debug('App is attempting to exit!');
        }
        if (!this._quitHandlers.length) {
            if (this.isDebug) {
                this.logger.debug('App now exits with no quit handlers!');
            }
            this._core.quit();
            return Promise.resolve(true);
        }
        const handlerPromises = this._quitHandlers.map(handler => handler(force));
        return Promise.all(handlerPromises).then(results => {
            // If at least one of the results is "false", cancel quit process.
            const cancel = results.reduce((prev, r) => !r && prev, true);
            // If the app is forced to quit, or if nobody prevents it from quitting.
            if (force || !cancel) {
                if (this.isDebug) {
                    this.logger.debug('App now exits! Force: ' + force);
                }
                this._core.quit();
                return true;
            }
            if (this.isDebug) {
                this.logger.debug('App quit is cancelled');
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
        const native = window.native;
        native['name'] = window.name;
        if (this._options.serveStaticFiles) {
            native.webContents.on('did-start-loading', () => this.processEmbededServerUrl(native));
        }
        native.on('closed', () => {
            this._windows.delete(window.name);
            if (!window.triggerGlobalClose) {
                return;
            }
            this.tryCloseAllWindows();
        });
        window.start();
        return window;
    }
    findWindow(name) {
        return this._windows.get(name);
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
            this._windows.get(name).native.setFullScreen(true);
            return;
        }
        this._windows.forEach(win => win.native.setFullScreen(true));
    }
    /**
     * Adds a listener to call before quit.
     * @param handler If this handler resolves to falsey value, it cancels quit process.
     */
    addQuitListener(handler) {
        if (!handler || !(typeof handler == 'function')) {
            throw new Error('Handler is not a function!');
        }
        this._quitHandlers.push(handler);
    }
    /**
     * Clears HTTP cache.
     */
    clearCache() {
        return eltr.session.defaultSession.clearCache();
    }
    /**
     * Clears all types of storage, not including HTTP cache.
     */
    clearStorage() {
        return new Promise((resolve) => {
            const options = {
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
                origin: '*',
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
        const displays = this.getAllDisplays();
        let externalDisplay = null;
        for (const i in displays) {
            if (displays[i].bounds.x != 0 || displays[i].bounds.y != 0) {
                externalDisplay = displays[i];
                break;
            }
        }
        return externalDisplay;
    }
    /**
     * Adds a listener to call when an error occurs.
     */
    onError(message) {
        this._logger.error(message);
    }
    /**
     * Displays a modal dialog that shows an error message. This API can be called
     * safely before the ready event the app module emits, it is usually used to report
     * errors in early stage of startup.  If called before the app readyevent on Linux,
     * the message will be emitted to stderr, and no GUI dialog will appear.
     */
    showErrorBox(title, content) {
        eltr.dialog.showErrorBox(title, content);
    }
    /**
     * Executes an OS command.
     */
    execCmd(command, options = {}) {
        options = Object.assign({
            cwd: global.appDiskRoot,
            stdio: 'inherit',
        }, options);
        return child_process_1.execSync(command, options);
    }
    /**
     * Occurs after application window is focused by user.
     */
    onActivated() {
        // Stub
    }
    /**
     * Occurs after all windows have been closed.
     */
    onAllWindowsClosed() {
        // Stub
    }
    /**
     * Occurs before application creates any windows.
     */
    onStarting() {
        // Stub
    }
    /**
     * Occurs after application has created all windows.
     */
    onStarted() {
        // Stub
    }
    createLogger() {
        const dirPath = this._options.logDirPath, loggerOpts = dirPath
            ? {
                debugDirPath: dirPath,
                errorDirPath: dirPath,
            }
            : null;
        return new MainLogger_1.MainLogger(loggerOpts);
    }
    initAppRoot() {
        let appDiskRoot, appCodeRoot;
        appCodeRoot = appDiskRoot = process.cwd();
        if (this._options.packMode) {
            appCodeRoot = path.join(process.cwd(), 'resources', 'app.asar');
            if (this.isDebug) {
                this.logger.debug('packMode is ON');
            }
        }
        Object.defineProperty(global, 'appDiskRoot', {
            value: appDiskRoot,
            configurable: false,
            writable: false,
        });
        Object.defineProperty(global, 'appCodeRoot', {
            value: appCodeRoot,
            configurable: false,
            writable: false,
        });
        if (this.isDebug) {
            this.logger.debug('appDiskRoot: ' + global.appDiskRoot);
            this.logger.debug('appCodeRoot: ' + global.appCodeRoot);
        }
    }
    initOptions(options) {
        const DEFAULT_OPTS = {
            globalClose: false,
            logDirPath: path.join(process.cwd(), 'logs'),
            quitWhenAllWindowsClosed: true,
            serveStaticFiles: true,
            staticFileDomain: 'localhost',
            staticFilePort: 30000,
            packMode: false,
        };
        return this._options = Object.assign(DEFAULT_OPTS, options);
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
        const app = this._core;
        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.
        app.on('ready', () => {
            this._status = AppStatus.Ready;
            this._event.emit('app-ready');
        });
        // Quit when all windows are closed.
        app.on('window-all-closed', () => {
            this.onAllWindowsClosed();
            if (this._options.quitWhenAllWindowsClosed) {
                this.quit();
            }
        });
        app.on('activate', () => {
            this.onActivated();
        });
    }
    processEmbededServerUrl(win) {
        /**
         * Transform resource file URLs
         */
        const filter = {
            urls: [],
        };
        win.webContents.session.webRequest.onBeforeRequest(filter, (detail, cb) => {
            // *
            const rootPath = this._options.staticFileRootPath || '~/';
            let { url } = detail, redirectURL = null;
            const pos = url.indexOf(rootPath);
            if (pos >= 0) {
                url = url.substring(pos + rootPath.length);
                // Map from "~/" to "localhost/""
                redirectURL = `${global.webRoot}/${url}`;
            }
            // */
            // this.log('debug', 'Old URL: ' + url);
            // this.log('debug', 'New URL: ' + redirectURL);
            cb({ redirectURL });
        });
    }
    serveStaticFiles() {
        const opts = this._options, domain = opts.staticFileDomain || 'localhost';
        const port = opts.staticFilePort || 30000;
        const source = opts.staticFileSource || process.cwd();
        const dest = opts.staticFileCache || path.join(source, 'assets', 'tiny-cdn-cache');
        if (!fs.existsSync(dest)) {
            this.logger.info(`Cache path doesn't exist, create one at: ${dest}`);
            fs.mkdirSync(dest);
        }
        return new Promise(resolve => {
            http.createServer(tinyCdn.create({ source, dest }))
                .listen(port, () => {
                // Add read-only property
                Object.defineProperty(global, 'webRoot', {
                    value: `http://${domain}:${port}`,
                    configurable: false,
                    writable: false,
                });
                if (this.isDebug) {
                    this.logger.debug('webRoot: ' + global.webRoot);
                }
                resolve();
            })
                .on('error', (err) => this.onError(err));
        })
            .catch(err => {
            this.onError(err);
            process.exit();
        });
    }
}
exports.ElectronAppBase = ElectronAppBase;
//# sourceMappingURL=ElectronAppBase.js.map