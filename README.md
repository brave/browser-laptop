[![Lint](https://badges.herokuapp.com/travis/brave/browser-laptop?env=TEST_DIR=lint&label=lint)](https://travis-ci.org/brave/browser-laptop)
[![Unit Tests](https://badges.herokuapp.com/travis/brave/browser-laptop?env=TEST_DIR=unit&label=unit-tests)](https://travis-ci.org/brave/browser-laptop)
[![About Tests](https://badges.herokuapp.com/travis/brave/browser-laptop?env=TEST_DIR=about&label=about-tests)](https://travis-ci.org/brave/browser-laptop)
[![App Tests](https://badges.herokuapp.com/travis/brave/browser-laptop?env=TEST_DIR=app&label=app-tests)](https://travis-ci.org/brave/browser-laptop)
[![Bookmark Tests](https://badges.herokuapp.com/travis/brave/browser-laptop?env=TEST_DIR=bookmark-components&label=bookmark-component-tests)](https://travis-ci.org/brave/browser-laptop)
[![Bravery Tests](https://badges.herokuapp.com/travis/brave/browser-laptop?env=TEST_DIR=bravery-components&label=bravery-component-tests)](https://travis-ci.org/brave/browser-laptop)
[![Contents Tests](https://badges.herokuapp.com/travis/brave/browser-laptop?env=TEST_DIR=contents&label=contents-tests)](https://travis-ci.org/brave/browser-laptop)
[![Misc Tests](https://badges.herokuapp.com/travis/brave/browser-laptop?env=TEST_DIR=misc-components&label=misc-components-tests)](https://travis-ci.org/brave/browser-laptop)
[![Navbar Tests](https://badges.herokuapp.com/travis/brave/browser-laptop?env=TEST_DIR=navbar-components&label=navbar-components-tests)](https://travis-ci.org/brave/browser-laptop)
[![Tab Tests](https://badges.herokuapp.com/travis/brave/browser-laptop?env=TEST_DIR=tab-components&label=tab-components-tests)](https://travis-ci.org/brave/browser-laptop)

# Brave Browser

Desktop browser for macOS, Windows, and Linux.

Follow [@brave](https://twitter.com/brave) on Twitter for important news and announcements.

For other versions of our browser, please see:
* iPhone - [brave/browser-ios](https://github.com/brave/browser-ios)
* Android - [brave/browser-android](https://github.com/brave/browser-android-tabs)

## Downloads

To download the latest release, [see our releases page](https://github.com/brave/browser-laptop/releases).

You can also [visit our website](https://brave.com/downloads.html) to get the latest stable release (along with a more user-friendly download page).

## Community

[Join the community](https://community.brave.com/) if you'd like to get more involved with Brave. You can [ask for help](https://community.brave.com/c/help-me),
[discuss features you'd like to see](https://community.brave.com/c/feature-requests), and a lot more. We'd love to have your help so that we can continue improving Brave.

## Useful documentation

* See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for tips and guidelines about contributing.
* See [docs/style.md](docs/style.md) for information on styling.
* See [docs/tests.md](docs/tests.md) for information on testing, including how to run a subset of the tests.
* See [docs/debugging.md](docs/debugging.md) for information on debugging.
* See [docs/translations.md](docs/translations.md) to learn how you can help us with translations (localization).
* See [docs/linuxInstall.md](docs/linuxInstall.md) for information on installing the browser on Linux distributions.

## Running from source

If you're setting up using Windows, please see the [Building on Windows wiki entry](https://github.com/brave/browser-laptop/wiki/(setup)-Windows-build-guide) for a full walkthrough.

For other platforms (macOS, Linux) You'll need certain packages installed before you can build and run Brave locally.

### Prerequisites

1. `nodejs` **`>= 6.1`**

    Install from your package manager or download from https://nodejs.org

2. `node-gyp` **`3.3.1`**

        sudo npm install -g node-gyp@3.3.1

#### On Debian/Ubuntu

````
apt-get install libgnome-keyring-dev build-essential rpm ninja-build
````

#### On Fedora

````
dnf install libgnome-keyring-devel rpm-build
dnf group install "Development Tools" "C Development Tools and Libraries"
````

### Installation

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

If this fails on Linux with an error related to `ad-block`, try updating to Node 6.1 and `node-gyp` 3.3.1 (see discussion at https://github.com/brave/browser-laptop/issues/214)

Instead of `npm install` you may also install with [yarn](https://github.com/yarnpkg/yarn).

### Troubleshooting

Additional notes on troubleshooting installation issues are in the [Troubleshooting](https://github.com/brave/browser-laptop/wiki/Troubleshooting) page in the Wiki.

### Preconfigured VMs

Some platforms are available as pre-configured VMs. See the [readme](https://github.com/brave/browser-laptop/blob/master/test/vms/vagrant/README.md) for details.

### Running Brave

To run a development version of the browser requires a few steps. The easiest way is just to use two
terminals. One terminal can be used just to watch for changes to the code

    npm run watch

Now actually run Brave in another terminal

    npm start

To run the webdriver tests:

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

## Running inside of a development version of [Muon](https://github.com/brave/muon)

By default, we provide pre-built binaries when you `npm install` with our own fork of [electron-prebuilt](https://github.com/brave/electron-prebuilt).

If you want to modify the code to [Muon](https://github.com/brave/muon) (Brave's Electron fork), then you'll need to build it. An example of why you might do that would be exposing a new event to the webview (from Muon).

To start this process, you'll want to check out our [browser-laptop-bootstrap](https://github.com/brave/browser-laptop-bootstrap) repo. From there, [you can follow the steps in our wiki](https://github.com/brave/browser-laptop-bootstrap/wiki) to get up and running.

## Packaging for bundles, installers, and updates

Please [see our wiki entry](https://github.com/brave/browser-laptop/wiki/Packaging-for-bundles,-installers,-and-updates) for more information about packaging.
