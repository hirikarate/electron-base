import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import * as winston from 'winston';
import 'winston-daily-rotate-file';


const DEFAULT_LOCATION = path.join(process.cwd(), 'logs');

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

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
		return this.logConsole('info', message);
	}

	/**
	 * Writes message to console and debug file.
	 */
	public debug(message: any): Promise<void> {
		return this.logDebug('debug', message);
	}

	/**
	 * Writes message to console and error file.
	 */
	public warn(message: any): Promise<void> {
		return this.logError('warn', message);
	}

	/**
	 * Writes message to console and error file.
	 */
	public error(message: any): Promise<void> {
		return this.logError('error', message);
	}


	private logConsole(level: LogLevel, message: any): Promise<void> {
		return this.log(level, message, this._infoLogger);
	}

	private logDebug(level: LogLevel, message: any): Promise<void> {
		return this.log(level, message, this._debugLogger);
	}

	private logError(level: LogLevel, message: any): Promise<void> {
		let error = new Error(message);
		return this.log(level, util.format('%s. Stacktrace: %s', error.message, error.stack), this._errorLogger);
	}

	private log(level: LogLevel, message: any, logger: winston.LoggerInstance): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			logger.log(level, message + '', (err) => {
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
}