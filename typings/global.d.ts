/// <reference types="electron" />

declare namespace NodeJS {
	export interface Global {
		/**
		 * Reference to current instance of `ElectronAppBase`
		 */
		app: any;

		/**
		 * Absolute path to application root.
		 */
		appRoot: string;

		/**
		 * Root URL to access static files. 
		 * Only has value if static file server is enabled.
		 */
		webRoot: string;

		/**
		 * Indicates whether this code is packed in ASAR archive
		 */
		packMode: boolean;

		/**
		 * Name of the window in which this script is running.
		 * This property is only available on renderer thread.
		 */
		windowName: string;

		/**
		 * Calls function of the browser window in which this code is loaded.
		 * If want to call app functions, use `ElectronUtil.callMain`.
		 * This global function is only available after calling `ElectronUtil.registerGlobalFunctions(global.windowName)`
		 */
		callMain(func: string, callback, ...params): void;

		/**
		 * Calls function of the window in which this code is loaded.
		 * If want to call app functions, use `ElectronUtil.callMainSync`.
		 * This global function is only available after calling `ElectronUtil.registerGlobalFunctions(global.windowName)`
		 */
		callMainSync(func: string, ...params): { result, error };
	}
}