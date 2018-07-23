# Electron base library

Provides abstract base app class and window class for other Electron app to inherit.

## INSTALLATION

1. Install `node-pre-gyp` globally: `npm install --global node-pre-gyp`

1. Install `windows-build-tools` globally: `npm install --global --production windows-build-tools`

## DEVELOPMENT

1. `npm install`

1. `gulp watch`

## RELEASE

* `gulp release`

* How to rebuild Node native module for this Electron version: 
   - Navigate to module folder. E.g: `cd ./node_modules/sqlite3`
   - `node-pre-gyp rebuild --target=1.8.7 --arch=x64 --dist-url=https://atom.io/download/atom-shell`
   - If build fails, try changing the target to `1.8.6`, or `1.8.5`, etc. But keep it in range `1.8.x`.

* Equivalent Node version: `v8.2.1`