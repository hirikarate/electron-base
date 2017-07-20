# Electron base library

Provides abstract base app class and window class for other Electron app to inherit.

## INSTALLATION

1. Install `node-gyp` globally: `npm install --global node-gyp`

1. Install `node-pre-gyp` globally: `npm install --global node-pre-gyp`

1. Install `windows-build-tools` globally: `npm install --global --production windows-build-tools`

## DEVELOP

1. `npm install`

1. `gulp watch`

## RELEASE

* `gulp release`

## VERSIONS

### 0.2.1

- **RendererUtil**: Removed deprecated functions
- **RendererLogger**: Fixed a bug when passing renderer error to main app.

### 0.2.0

- **RendererUtil**: Do not allow creating new instance. Must use singleton with `import { rendererUtil } from 'front-lib-electron-base';`
- **MainLogger**: Logger used by main process to write messages to system console and file (including stacktrace). Cannot create new instance, must use with `this.logger` (inside main app class) and `rendererUtil.mainApp.logger` (inside renderer process).
- **RendererLogger**: Logger used by renderer process to write messages to browser console, but also can write errors to file. Cannot create new instance, must use with `rendererUtil.logger`.
- **ElectronWindowBase**:
    * Fixed the bug where modal dialog appears as a standalone window.
	* Provides some delegated methods from native BrowserWindow class.
	* Provides methods to open different types of dialogs.
- Do not need to edit `app.d.ts` file manually anymore. Everything is automatic when `gulp release`.
- Added `packMode` to `ElectronAppOptions` and `global`.
- Use a custom `tiny-cdn` repo to make it work with Webpack.

### 0.1.1

- Use `__dirname` instead of `process.cwd()` in some places to better support electron-builder and webpack internal reference mechanism.
- Main app class exposes `onError` as public method for other classes to report errors.
- **RendererUtil**:
    * Uses `remote` to call functions in main process.
	* Deprecated IPC methods.

### 0.1.0

- **ElectronAppBase**: Supports embeded static file server, logging and several events.
- **ElectronWindowBase**: Supports common events
- **RendererUtil**: 
  - Supports calling functions from main app class and parent window, allows send/receive complex JS objects.
  - [Deprecated] Supports inter-process communication (IPC) functions for renderer processes to call main process's methods. Only allows send/receive serializable JSON objects.