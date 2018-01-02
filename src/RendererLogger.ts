import * as util from 'util';

import { MainLogger } from './MainLogger';


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
	 * @param error A string, support %s (string), %i (number).
	 */
	public error(error: any): void {
		console.error(error);
		error = { message: this.errorToString(error), stack: error.stack || '' };
		this._mainLogger.error(error);
	}


	private errorToString(error): string {
		if ((typeof error) === 'string') { return error; }

		let msg = '';
		if (error.type) { msg += error.type + '.'; }
		if (error.name) { msg += error.name + '.'; }
		if (error.stderr) { msg += error.stderr + '.'; }
		if (error.message) { msg += error.message + '.'; }
		if (error.detail) { msg += error.detail + '.'; }
		if (error.details) { msg += error.details + '.'; }

		if (msg == '') {
			msg = JSON.stringify(error);
		}

		return msg;
	}
}