[![Build Status](https://travis-ci.org/brave/browser-laptop.svg?branch=master)](https://travis-ci.org/brave/browser-laptop)

# Brave Browser

Desktop browser for macOS, Windows, and Linux.

Follow [@brave](https://twitter.com/brave) on Twitter for important news and announcements.

For other versions of our browser, please see:
* iPhone - [brave/browser-ios](https://github.com/brave/browser-ios)
* Android - [brave/browser-android](https://github.com/brave/browser-android)

## Downloads

To download the latest release, [see our releases page](https://github.com/brave/browser-laptop/releases).

For a more user-friendly download page, [please visit our website](https://brave.com/downloads.html).

## Useful documentation

* See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for tips and guidelines about contributing.
* See [docs/tests.md](docs/tests.md) for information on testing, including how to run a subset of the tests.
* See [docs/debugging.md](docs/debugging.md) for information on debugging.
* See [docs/translations.md](docs/translations.md) to learn how you can help us with translations (localization).

## Build prerequisites

You'll need certain packages installed before you can build and run Brave locally.

### Windows

Please see the [Building on Windows wiki entry](https://github.com/brave/browser-laptop/wiki/(setup)-Windows-build-guide)

### All other platforms

1. `nodejs` **`>= 6.1`**

    Install from your package manager or download from https://nodejs.org

2. `node-gyp` **`3.3.1`**

        sudo npm install -g node-gyp@3.3.1

###  Linux

On Debian/Ubuntu

````
apt-get install libgnome-keyring-dev build-essential
````

On Fedora

````
dnf install libgnome-keyring-devel rpm-build
dnf group install "Development Tools" "C Development Tools and Libraries"
````

## Installation

After installing the prerequisites:

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

If this fails on Linux with an error related to `abp-filter-parser-cpp`, try updating to Node 6.1 and `node-gyp` 3.3.1 (see discussion at https://github.com/brave/browser-laptop/issues/214)

Instead of `npm install` you may also install with [yarn](https://github.com/yarnpkg/yarn).

### Troubleshooting

Additional notes on troubleshooting installation issues are in the [Troubleshooting](https://github.com/brave/browser-laptop/wiki/Troubleshooting) page in the Wiki.

### Preconfigured VMs

Some platforms are available as pre-configured VMs. See the [readme](https://github.com/brave/browser-laptop/blob/master/test/vms/vagrant/README.md) for details.

## Development

To run a development version of the browser requires a few steps. The easiest way is just to use two 
terminals. One terminal can be used just to watch for changes to the code

    npm run watch

Now actually run Brave in another terminal

    npm start

To run the tests:

    npm run watch-test  or  npm run watch-all

    npm test

Some errors related to [brave/electron](https://github.com/brave/electron) update can be fixed by doing a clean install:

    rm -rf node_modules/
    npm install

If this does not work, please clear out your ~/.electron first and try again.

### Port

Brave uses port 8080 to communicate between its client and server sides by default. If you are using port 8080 for something else (e.g. a web proxy) then you can set the node config to make it use a different one.

e.g.
npm config set brave:port 9001

Additional notes on troubleshooting development issues are in the [Troubleshooting](https://github.com/brave/browser-laptop/wiki/Troubleshooting) page in the Wiki.

### Running inside of a development version of Brave's Electron fork

We are using a [fork of Electron with some minor modifications](https://github.com/brave/electron). We try to upstream everything to [electron/electron](https://github.com/electron/electron) but forking allows us to take patches before upstreaming.

By default, we provide pre-built binaries when you `npm install` with our own fork of [electron-prebuilt](https://github.com/brave/electron-prebuilt).

If you want to modify the code to Electron itself, then you'll need to build it.  An example of why you might do that would be exposing a new event to the webview from Electron.

Build instructions:
- [macOS build instructions](https://github.com/brave/electron/blob/master/docs/development/build-instructions-osx.md)
- [Windows build instructions](https://github.com/brave/electron/blob/master/docs/development/build-instructions-windows.md)
- [Linux build instructions](https://github.com/brave/electron/blob/master/docs/development/build-instructions-linux.md)

Once you're happy with the changes you've made in the electron fork, you can test the changes locally by building and then copying the output files over the `node_modules/electron-prebuilt` for browser-laptop.

Assuming you have your directories in a structure such as this:

    projects/
        electron/
        browser-laptop/

You can simply run an npm task to build and install your local electron instance:

    npm run install

If your directory structure isn't side by side, you can run the following (altering the rsync as needed) command from within electron:

    rsync -avz --delete out/D/Brave.app dist {{path-to-browser-laptop}}/node_modules/electron-prebuilt/dist/ 


## Packaging for bundles, installers, and updates

In order do run any build commands, you'll need an environment variable set for `CHANNEL` (set to `'dev'`, `'beta'`, or `'stable'`).

For more information, see [docs/buildingReleases.md](docs/buildingReleases.md) which has a more detailed overview of our release process.

### macOS:

From within brave-browser you can create a .app file for distribution:

    CHANNEL=dev npm run build-package

After the .app file is built you can create a dmg and update zip with:

    IDENTIFIER=XYZ npm run build-installer

Where XYZ is your signing identifier.

### Windows 7,8,10 x64:

You'll also need to set the `CERT` and `CERT_PASSWORD` environment variables with your [authenticode signing cert and password](https://blogs.msdn.microsoft.com/ieinternals/2011/03/22/everything-you-need-to-know-about-authenticode-code-signing/) if you want to build an installer.

To set these values, you can either set the environment on a per-session basis (`$env:CHANNEL="dev"`) or update your [system/user environment variables](http://www.computerhope.com/issues/ch000549.htm).

You must also have NSIS 3.0rc2 or later installed and `makensis`'s folder must be in your PATH.

To create a folder with the app .exe and all dependencies you can run:

    CHANNEL=dev npm run build-package

After the above folder is created, you can create a setup (exe, msi, RELEASES file and update nupkg) with:

    npm run build-installer

### Linux:

To create a package:

    CHANNEL=dev npm run build-package

To create a dev package:

    CHANNEL=dev npm run build-package

Finally run:

    npm run build-installer

You will see a .deb and .rpm files in dist/
