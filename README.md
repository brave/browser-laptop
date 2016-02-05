[![Build Status](https://travis-ci.org/brave/browser-laptop.svg?branch=master)](https://travis-ci.org/brave/browser-laptop)

# Brave Browser

Laptop and Desktop browser for OS X, Windows and Linux.

## Requirements

1. nodejs >= 5.0

    Install from your package manager or download from https://nodejs.org

2. node-gyp 3.2.1

    sudo npm install -g node-gyp@3.2.1

[Prerequisites](https://github.com/brave/browser-laptop/blob/master/docs/prerequisites.md) for Windows


## Installation

Make sure you have all of the pre-requisite compilers/applications [Installed](https://github.com/brave/browser-laptop/blob/master/docs/prerequisites.md)

1. Clone the git repository from GitHub:

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

If this fails on Linux with an error related to `abp-filter-parser-cpp`, try updating to Node 5.5 and `node-gyp` 3.2.1 (see discussion at https://github.com/brave/browser-laptop/issues/214)

During installation you will likely see lines like the following which may be safely ignored

    npm WARN deprecated css-list@0.1.3: Deprecated.
    npm WARN install Couldn't install optional dependency: Unsupported

If installing on a new machine with little or no node.js previously installed this can take a long time, especially if you are outside the USA and/or have limited bandwidth. In such cases you may also get github timeouts which result in failures due to ECONNRESET messages or similar. If this happens. you should simply rerun the `npm install` command until these stop

## Development

To start the server and file watchers run the following on the command line:

    npm run watch

To run the browser:

    npm start

To run the tests:

    npm run watch-test  or  npm run watch-all

    npm test

Note: Brave uses port 8080 to communicate between its client and server sides by default. If you are using port 8080 for something else (e.g. a web proxy) then you can set the environment variable `BRAVE_PORT` to make it use a different one.

e.g.
`BRAVE_PORT=9001 npm run watch`

`BRAVE_PORT=9001 npm run start`



### Debugging

See [docs/debugging.md](docs/debugging.md) for information on debugging.

### Running inside of a development version of Brave's Electron fork

We are using a fork of Electron with some minor modifications here: https://github.com/brave/electron

Most of the time you will not need to use that repository, we provide pre-built binaries when you `npm install` with our own fork of [electron-prebuilt](https://github.com/brave/electron-prebuilt).

If you want to add code to Electron itself, then you may want to build it.  An example would be exposing a new event to the webview from Electron.   We try to upstream everything to [atom/electron](https://github.com/atom/electron) but we can take things in our fork early before upstreaming.

Build instructions:
- [OSX build instructions](https://github.com/brave/electron/blob/master/docs/development/build-instructions-osx.md)
- [Windows build instructions](https://github.com/brave/electron/blob/master/docs/development/build-instructions-windows.md)
- [Linux build instructions](https://github.com/brave/electron/blob/master/docs/development/build-instructions-linux.md)

## Packaging for bundles, installers, and updates

### OSX:

From within brave-browser you can create a .app file for distribution:

    npm run build-package

After the .app file is built you can create a dmg and update zip with:

    IDENTIFIER=XYZ npm run build-installer

Where XYZ is your signing identifier.

### Windows 7,8,10 x64:

To create a folder with the app .exe and all dependencies:

    npm run build-package

After the above folder is created, you can create a setup (exe, msi, RELEASES file and update nupkg) with:

    CERT_PASSWORD=‘XYZ’ npm run build-installer

  Where XYZ is your authenticode signing password.

### Linux:

To create a package:

    npm run build-package
