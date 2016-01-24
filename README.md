# Brave Browser

Laptop and Desktop browser for OS X, Windows and Linux.

## Installation

1. Shallow clone the git repository from GitHub:
        
        # For beta testers:
        git clone --depth 1 https://github.com/brave/browser-laptop
        
        # For devs over HTTPS:
        git clone https://github.com/brave/browser-laptop

        # For devs over SSH:
        git clone git@github.com:brave/browser-laptop.git

2. Open the working directory:

        cd browser-laptop

3. Install the Node (v5+) dependencies:

        npm install

If this fails on Linux with an error related to `abp-filter-parser-cpp`, try updating to Node 5.5 (see discussion at https://github.com/brave/browser-laptop/issues/214)

## Development

To start the server and file watchers run the following on the command line:

    npm run watch

To run the browser:

    npm start

To run the tests:

    npm run watch-test  or  npm run watch-all

    npm test

See [docs/debugging.md](docs/debugging.md) for information on debugging.

### Running inside of a development version of Brave's Electron fork

We are using a fork of Electron with some minor modifications here: https://github.com/brave/electron

Most of the time you will not need to use that repository, we provide pre-built binaries when you `npm install` with our own fork of [electron-prebuilt](https://github.com/brave/electron-prebuilt).

If you want to add code to Electron itself, then you may want to build it.  An example would be exposing a new event to the webview from Electron.   We try to upstream everything to [atom/electron](https://github.com/atom/electron) but we can take things in our fork early before upstreaming.

Build instructions:
- [OSX build instructions](https://github.com/brave/electron/blob/master/docs/development/build-instructions-osx.md)
- [Windows build instructions](https://github.com/brave/electron/blob/master/docs/development/build-instructions-windows.md)
- [Linux build instructions](https://github.com/brave/electron/blob/master/docs/development/build-instructions-linux.md)

## Packaging

### OSX:

From within brave-browser you can create a .app file for distribution:

    npm run build-darwin

After the .app file is built you can create a dmg with:

    npm run installer-darwin

### Windows 7,8,10 x64:

Prerequisite: You must have NSIS installed.

To create a folder with the app .exe and all dependencies:

    npm run build-win64

After the above folder is created, you can create an NSIS based installer with:

    npm run installer-win64

## Developer Tools

Development builds will automatically open developer tools within the browser.
