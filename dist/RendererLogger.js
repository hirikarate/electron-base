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
        error = (error instanceof Error)
            ? { message: error.message, stack: error.stack }
            : { message: error };
        this._mainLogger.error(error);
    }
}
exports.RendererLogger = RendererLogger;

//# sourceMappingURL=RendererLogger.js.map
