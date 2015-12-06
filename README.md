# Brave Browser

Laptop and Desktop browser for OS X and Windows built on top of the Electron framework (Node + Chromium content module).

## Installation

1. Clone the git repository from GitHub:

        git clone git@github.com:brave/browser-electron.git

2. Open the working directory:

        cd browser-electron

3. Install the Node dependencies:

        npm install

## Development

To start the server and file watchers run the following on the command line:

    npm run watch


To run the browser:

    num start


### Running inside of a development version of Brave's Electron fork

We are currently using a fork of Electron with some minor modifications here: https://github.com/brave/electron

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

### Other platforms:

Packaging is not implemented yet for other platforms, but it would be simple for linux.


## Developer Tools

Development builds will automatically open developer tools within the browser.
