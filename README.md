# Electron base library

Provides abstract base app class and window class for other Electron app to inherit.

## INSTALLATION

1. Install `node-gyp` globally: `npm install --global node-gyp`

1. Install `node-pre-gyp` globally: `npm install --global node-pre-gyp`

1. Install `windows-build-tools` globally: `npm install --global --production windows-build-tools`

## VERSIONS

### 0.1.0

- **ElectronAppBase**: Supports embeded static file server, logging and several events.
- **ElectronWindowBase**: Supports common events
- **RendererUtil**: 
  - Supports calling functions from main app class and parent window, allows send/receive complex JS objects.
  - [Deprecated] Supports inter-process communication (IPC) functions for renderer processes to call main process's methods. Only allows send/receive serializable JSON objects.

### 0.1.1

- Use `__dirname` instead of `process.cwd()` in some places to better support electron-builder and webpack internal reference mechanism.
- Main app class exposes `onError` as public method for other classes to report errors.

### 1.0.0

- Will be upgraded to 1.0.0 if `back-lib-common-util` is upgraded to 1.0.0
