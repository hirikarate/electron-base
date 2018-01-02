/// <reference types="electron" />

declare namespace NodeJS {
	export interface Global {
		/**
		 * Reference to current instance of `ElectronAppBase`
		 */
		app: any;

		/**
		 * Physical path to application root. Used for file writing.
		 */
		appDiskRoot: string;

		/**
		 * Logical path to application root. Used for accessing resources bundled by
		 * electron-builer.
		 */
		appCodeRoot: string;

		/**
		 * Whether app is in debug mode.
		 */
		isDebug: boolean;

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
	}
}