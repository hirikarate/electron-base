
## VERSIONS

### 1.1.0
- `electron` is peer dependency now.

### 1.0.1
- Fixed error in app.d.ts.

### 1.0.0
- Upgraded to electron@1.8.7
- Added a guide in README.md to rebuild Node native module.
- Rebuilt as ES2017.

### 0.2.4
- Upgraded to electron@1.7.9

### 0.2.3
- Improved logger's stringify feature.
- Added communication utility.
- Replaced `global.appRoot` with `appDiskRoot` and `appCodeRoot`.

### 0.2.2

- Added `dedup` task to `gulpfile.js`.
- Updated dependencies' version.

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