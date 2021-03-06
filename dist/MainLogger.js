"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const util = require("util");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const DEFAULT_LOCATION = path.join(process.cwd(), 'logs');
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
/**
 * Logger for main process, writes logs to system console and files.
 */
class MainLogger {
    constructor(_options = {}) {
        this._options = _options;
        this._options = Object.assign({
            debugDirPath: DEFAULT_LOCATION,
            errorDirPath: DEFAULT_LOCATION,
        }, this._options);
        this.init();
    }
    /**
     * Writes message to console.
     */
    info(message) {
        return this.logConsole(LogLevel.INFO, message);
    }
    /**
     * Writes message to console and debug file.
     */
    debug(message) {
        return this.logDebug(LogLevel.DEBUG, message);
    }
    /**
     * Writes message to console and error file.
     */
    warn(message) {
        return this.logError(LogLevel.WARN, message);
    }
    /**
     * Writes message to console and error file.
     */
    error(message) {
        return this.logError(LogLevel.WARN, message);
    }
    logConsole(level, message) {
        return this.log(level, message, this._infoLogger);
    }
    logDebug(level, message) {
        return this.log(level, message, this._debugLogger);
    }
    logError(level, error) {
        const text = util.format('%s.\nStacktrace: %s', this.errorToString(error), error.stack || '');
        return this.log(level, text, this._errorLogger);
    }
    log(level, message, logger) {
        return new Promise((resolve, reject) => {
            logger.log(level, this.anyToString(message), (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    init() {
        this._infoLogger = winston.createLogger({
            transports: [
                new (winston.transports.Console)({
                    level: 'info',
                }),
            ],
        });
        const debugDir = this._options.debugDirPath;
        if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir);
        }
        this._debugLogger = winston.createLogger({
            transports: [
                new (winston.transports.Console)({
                    level: 'debug',
                }),
                new DailyRotateFile({
                    level: 'debug',
                    filename: path.join(debugDir, 'debug-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '10m',
                    maxFiles: '14d',
                }),
            ],
        });
        const errorDir = this._options.errorDirPath;
        if (!fs.existsSync(errorDir)) {
            fs.mkdirSync(errorDir);
        }
        this._errorLogger = winston.createLogger({
            transports: [
                new (winston.transports.Console)({
                    level: 'warn',
                }),
                new DailyRotateFile({
                    filename: path.join(errorDir, 'error-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    level: 'warn',
                    zippedArchive: true,
                    maxSize: '10m',
                    maxFiles: '14d',
                }),
            ],
        });
    }
    errorToString(error) {
        if ((typeof error) === 'string') {
            return error;
        }
        let msg = '';
        if (error.type) {
            msg += error.type + '.';
        }
        if (error.name) {
            msg += error.name + '.';
        }
        if (error.stderr) {
            msg += error.stderr + '.';
        }
        if (error.message) {
            msg += error.message + '.';
        }
        if (error.detail) {
            msg += error.detail + '.';
        }
        if (error.details) {
            msg += error.details + '.';
        }
        if (msg == '') {
            msg = JSON.stringify(error);
        }
        return msg;
    }
    anyToString(message) {
        return ((typeof message) === 'string' ? message : JSON.stringify(message));
    }
}
exports.MainLogger = MainLogger;
//# sourceMappingURL=MainLogger.js.map