"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
/**
 * Logger for renderer process, writes debug logs to browser console,
 * and delegates error logs to main logger to write to files.
 */
class RendererLogger {
    constructor(_mainLogger) {
        this._mainLogger = _mainLogger;
    }
    /**
     * Writes info message to browser console.
     * @param message A string, support %s (string), %i (number).
     * @param optionalParams Params to take place of %s and %i in `message`.
     */
    info(message, ...optionalParams) {
        if (optionalParams && optionalParams.length) {
            console.info(message, optionalParams);
        }
        else {
            console.info(message);
        }
    }
    /**
     * Writes debug message to browser console.
     * @param message A string, support %s (string), %i (number).
     * @param optionalParams Params to take place of %s and %i in `message`.
     */
    debug(message, ...optionalParams) {
        if (optionalParams && optionalParams.length) {
            console.debug(message, optionalParams);
        }
        else {
            console.debug(message);
        }
    }
    /**
     * Writes warn message to browser console.
     * @param message A string, support %s (string), %i (number).
     * @param optionalParams Params to take place of %s and %i in `message`.
     */
    warn(message, ...optionalParams) {
        if (optionalParams && optionalParams.length) {
            console.warn(message, optionalParams);
        }
        else {
            console.warn(message);
        }
    }
    /**
     * Writes error message to browser console AND sends to main process to dumb to file.
     * @param message A string, support %s (string), %i (number).
     * @param optionalParams Params to take place of %s and %i in `message`.
     */
    error(message, ...optionalParams) {
        if (optionalParams && optionalParams.length) {
            console.error(message, optionalParams);
            this._mainLogger.error(util.format(message, optionalParams));
        }
        else {
            console.error(message);
            this._mainLogger.error(message);
        }
    }
}
exports.RendererLogger = RendererLogger;

//# sourceMappingURL=RendererLogger.js.map
