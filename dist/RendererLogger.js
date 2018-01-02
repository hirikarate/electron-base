"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
     */
    info(message) {
        console.info(message);
    }
    /**
     * Writes debug message to browser console.
     * @param message A string, support %s (string), %i (number).
     */
    debug(message) {
        console.debug(message);
    }
    /**
     * Writes warn message to browser console.
     * @param message A string, support %s (string), %i (number).
     */
    warn(message) {
        console.warn(message);
    }
    /**
     * Writes error message to browser console AND sends to main process to dumb to file.
     * @param error A string, support %s (string), %i (number).
     */
    error(error) {
        console.error(error);
        error = { message: this.errorToString(error), stack: error.stack || '' };
        this._mainLogger.error(error);
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
}
exports.RendererLogger = RendererLogger;
