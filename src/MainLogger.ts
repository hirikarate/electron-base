import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import * as winston from 'winston';
import 'winston-daily-rotate-file';


const DEFAULT_LOCATION = path.join(process.cwd(), 'logs');

export enum LogLevel { DEBUG = 'debug', INFO = 'info', WARN = 'warn', ERROR = 'error' }

export interface LoggerOptions {
	/**
	 * Path to directory in which debug file is created.
	 * Default is: {appRoot}/logs/debug.log
	 */
	debugDirPath?: string;

	/**
	 * Path to directory in which error file is created.
	 * Default is: {appRoot}/logs/error.log
	 */
	errorDirPath?: string;
}

/**
 * Logger for main process, writes logs to system console and files.
 */
export class MainLogger {

	private _infoLogger: winston.LoggerInstance;
	private _debugLogger: winston.LoggerInstance;
	private _errorLogger: winston.LoggerInstance;

	constructor(private _options: LoggerOptions = {}) {
		this._options = Object.assign(<LoggerOptions>{
			debugDirPath: DEFAULT_LOCATION,
			errorDirPath: DEFAULT_LOCATION,
		}, this._options);
		this.init();
	}

	/**
	 * Writes message to console.
	 */
	public info(message: any): Promise<void> {
		return this.logConsole(LogLevel.INFO, message);
	}

	/**
	 * Writes message to console and debug file.
	 */
	public debug(message: any): Promise<void> {
		return this.logDebug(LogLevel.DEBUG, message);
	}

	/**
	 * Writes message to console and error file.
	 */
	public warn(message: any): Promise<void> {
		return this.logError(LogLevel.WARN, message);
	}

	/**
	 * Writes message to console and error file.
	 */
	public error(message: any): Promise<void> {
		return this.logError(LogLevel.WARN, message);
	}


	private logConsole(level: LogLevel, message: any): Promise<void> {
		if (!message) { return; }
		
		return this.log(level, message, this._infoLogger);
	}

	private logDebug(level: LogLevel, message: any): Promise<void> {
		if (!message) { return; }
		
		return this.log(level, message, this._debugLogger);
	}

	private logError(level: LogLevel, error: any): Promise<void> {
		if (!error) { return; }

		let text = util.format('%s.\nStacktrace: %s', this.errorToString(error), error.stack || '');

		return this.log(level, text, this._errorLogger);
	}

	private log(level: LogLevel, message: any, logger: winston.LoggerInstance): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			logger.log(level, this.anyToString(message), (err) => {
				if (err) {
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	private init(): void {
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

	private anyToString(message): string {
		return ((typeof message) === 'string' ? message : JSON.stringify(message));
	}

}