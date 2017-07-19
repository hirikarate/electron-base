"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const util = require("util");
const winston = require("winston");
require("winston-daily-rotate-file");
const DEFAULT_LOCATION = path.join(process.cwd(), 'logs');
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
        return this.logConsole('info', message);
    }
    /**
     * Writes message to console and debug file.
     */
    debug(message) {
        return this.logDebug('debug', message);
    }
    /**
     * Writes message to console and error file.
     */
    warn(message) {
        return this.logError('warn', message);
    }
    /**
     * Writes message to console and error file.
     */
    error(message) {
        return this.logError('error', message);
    }
    logConsole(level, message) {
        if (!message) {
            return;
        }
        return this.log(level, message, this._infoLogger);
    }
    logDebug(level, message) {
        if (!message) {
            return;
        }
        return this.log(level, message, this._debugLogger);
    }
    logError(level, error) {
        if (!error) {
            return;
        }
        let text;
        if (error.message || error.stack) {
            text = util.format('%s. Stacktrace: %s', error.message || '', error.stack || '');
        }
        else {
            text = error;
        }
        return this.log(level, text, this._errorLogger);
    }
    log(level, message, logger) {
        return new Promise((resolve, reject) => {
            logger.log(level, message + '', (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    init() {
        this._infoLogger = new winston.Logger({
            transports: [
                new (winston.transports.Console)({
                    level: 'info'
                })
            ]
        });
        let debugDir = this._options.debugDirPath;
        if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir);
        }
        this._debugLogger = new winston.Logger({
            transports: [
                new (winston.transports.Console)({
                    level: 'debug'
                }),
                new (winston.transports.DailyRotateFile)({
                    filename: path.join(debugDir, 'debug'),
                    datePattern: '-yyyy-MM-dd.log',
                    level: 'debug'
                })
            ]
        });
        let errorDir = this._options.errorDirPath;
        if (!fs.existsSync(errorDir)) {
            fs.mkdirSync(errorDir);
        }
        this._errorLogger = new winston.Logger({
            transports: [
                new (winston.transports.Console)({
                    level: 'warn'
                }),
                new (winston.transports.DailyRotateFile)({
                    filename: path.join(errorDir, 'error'),
                    datePattern: '-yyyy-MM-dd.log',
                    level: 'warn'
                })
            ]
        });
    }
}
exports.MainLogger = MainLogger;

//# sourceMappingURL=MainLogger.js.map
