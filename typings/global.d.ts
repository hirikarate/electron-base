declare namespace NodeJS {
	export interface Global {
		/**
		 * Absolute path to application root.
		 */
		appRoot: string;

		/**
		 * Root URL to access static files. 
		 * Only has value if static file server is enabled.
		 */
		webRoot: string;
	}
}