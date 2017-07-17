import * as util from 'util';

import { MainLogger, LogLevel } from './MainLogger';


/**
 * Logger for renderer process, writes debug logs to browser console,
 * and delegates error logs to main logger to write to files.
 */
export class RendererLogger {

	constructor(private readonly _mainLogger: MainLogger) {
	}

	/**
	 * Writes info message to browser console.
	 * @param message A string, support %s (string), %i (number).
	 */
	public info(message: any): void {
		console.info(message);
	}

	/**
	 * Writes debug message to browser console.
	 * @param message A string, support %s (string), %i (number).
	 */
	public debug(message: any): void {
		console.debug(message);
	}

	/**
	 * Writes warn message to browser console.
	 * @param message A string, support %s (string), %i (number).
	 */
	public warn(message: any): void {
		console.warn(message);
	}

	/**
	 * Writes error message to browser console AND sends to main process to dumb to file.
	 * @param message A string, support %s (string), %i (number).
	 */
	public error(message: any): void {
		console.error(message);
		this._mainLogger.error(message);
	}

}