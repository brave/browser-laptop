# Debugging

## Debugging the renderer processes

Most of the time you'll be debugging the renderer process and this can be done with the built in developer tools.
To open the dev tools use `Shift+F8`.

If you've ever used the built in Chrome developer tools you'll be right at home with a DOM inspector, Network monitor, Sources debugging, Timeline, Resources, Audits, and Console.

The code which runs in renderer processes is inside of the `js` directory.

Calls to `console.log` and related functions go into the dev tools console mentioned above.

If you're running `npm run watch`, then webpack dev server will ensure that changes to source code will reload the app.

## Debugging and profiling the browser process with the Chromium developer tools

The browser process can be debugged and profiled with remote developer tools via Node Inspector.

Pass the `--inspect` command line argument to the start script to enable node inspector.

`npm run start -- --inspect`

You can also break on startup with:

`npm run start -- --inspect --debug-brk`

On startup you'll see a message like this:

> To start debugging, open the following URL in Chrome:
>     chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/1cfd06a0-c36a-4d98-85ad-d357ca6bebc6

Start up Chrome and load that URL to see the developer tools that you're familiar with.

If your console or terminal has trouble copying text for the URL, you can also load `chrome://inspect` and click the link you see which brings you to the same place.

## Debugging the browser process with VS Code

One easy way to start debugging the browser process to `Attach` to, or `Launch` the process using [Visual Studio Code](https://code.visualstudio.com/) which works for macOS, Windows, and Linux.
Project configurations are already inside the subdirectory `.vscode`, and have been tested with macOS.  It may need tweaking for other platforms.

Running `Attach` requires that you run the `npm start` command beforehand, so it's listening on port `5858`. `Launch` will start the browser up for you.

When you're ready to get started, go to `File | Open...` and select the browser-laptop checked out repo directory.

**NOTE**: _On macOS, you will need to have the following folders created before `Launch` will work as expected:_

    ~/Library/Application Support/Electron-development/

    ~/Library/Application Support/Electron/

The left hand side of Visual Studio Code has a Debug Play button.  It allows you to attach or launch in debug mode, inspect variables, have a watch window, call stacks, line by line debugging, etc.

To pause the application before any code runs you can use `npm run start-brk`.

The code which runs in the main process is inside of the `app` directory.

Calls to `console.log` and related functions go into the terminal you did `npm start` from, or if you started within VSCode it will go to inside the `DEBUG CONSOLE`.

Unlike with the renderer process, since the main process isn't using webpack dev server, you will need to restart the app to see your changes.
The app can be restarted with `Command+Alt+R` when using a development environment.


## Debugging Content

Content is the web page which is loaded.  You can open the loaded content dev tools using `Command+Alt+I` on macOS or `Control+Alt+I` on Windows.

If you'd like to see code run on each page load, you can edit `app/extensions/brave/brave-default.js`.

Calls to `console.log` and related functions go into the per page dev tools console mentioned above.


## Profiling React code

The `Debug` menu has a `Toggle React Profiling` option which will start/stop the React addon for profiling.
The `window.perf` object is exposed for the window that is opened for more advanced usage.
An introduction to profiling in React is covered [here](http://benchling.engineering/performance-engineering-with-react/).


## Debugging Session Data

The session data is stored in OS specific user data directories. Within those directories there will be a `brave` directory for release builds and a `brave-development` directory for dev (from NODE_ENV). If you want to use a different directory for dev you can set the environment variable `BRAVE_USER_DATA_DIR` to the directory you want to use. Each test run goes in a new tmp directory inside the OS specific tmpdir. Normally these directories are removed when the test is finished, but if you want to keep them you can the enviroment variable `KEEP_BRAVE_USER_DATA_DIR` to true.

MacOS
~/Library/Application Support/brave

Linux
linux ~/.config/brave

Windows
C:\Users\username\AppData\Roaming\brave


## Debugging tests

See [tests.md](https://github.com/brave/browser-laptop/blob/master/docs/tests.md).


## Debugging Electron / Chromium C++

NOTE: this section references an out of date library (libchromiumcontent). For more info about our new structure, please see [browser-laptop-bootstrap](https://github.com/brave/browser-laptop-bootstrap/wiki).

### Logging

Enable Chromium and electron logging using:

`npm run start-log`

This will pass `--enable-logging=stderr` and set the log level to `--v=1` to `start.js`.

https://www.chromium.org/for-testers/enable-logging
[docs/api/chrome-command-line-switches.md](https://github.com/brave/electron/blob/master/docs/api/chrome-command-line-switches.md) from electron docs.

You can log with a command like `LOG(INFO) << "Here's some great info";` in both Electron and libchromiumcontent source files.

### Creating a project file for libchromiumcontent

If you just want to debug something quick open Xcode, `File -> New -> Project...`, select `Other`, and then `External Build System`.
You can Add just the files you want to debug and set breakpoints.

Apply this patch in libchromiumcontent:

```
ff --git a/script/update b/script/update
index 78a80c6..dfa9f03 100755
--- a/script/update
+++ b/script/update
@@ -121,7 +121,7 @@ def gyp_env(target_arch, component, gyp_defines):
   else:
     gyp_defines += ' ffmpeg_branding=Chrome component={0}'.format(component)

-  env['GYP_GENERATORS'] = 'ninja'
+  env['GYP_GENERATORS'] = 'ninja,xcode-ninja'
+  # For Visual Studio on Windows, use msvs-ninja instead

   if sys.platform in ['win32', 'cygwin']:
     # Do not let Chromium download their own toolchains.
@@ -143,6 +143,9 @@ def gyp_env(target_arch, component, gyp_defines):
   # Always build on 64-bit machine.
   gyp_defines += ' host_arch=x64'

+  # keep symbols for release builds
+  gyp_defines += ' mac_strip_release=0'
+
   # Build 32-bit or 64-bit.
   gyp_defines += ' target_arch={0}'.format(target_arch)
   env['GYP_DEFINES'] = gyp_defines
```

It will add symbols for your build and generate a project file which will do indexing on the source.
The Xcode project you should use can be found here: `./src/chromiumcontent/sources_for_indexing.xcodeproj`
The indexing takes several hours but you can debug without it.

You can set breakpoints in Chormium code in the project.
You can also add files in Xcode (even from brave/electron C++).
Inside Xcode you'll often use [lldb comamnds](http://lldb.llvm.org/lldb-gdb.html) like `lldb expr varname`


### Building changes for libchromiumcontent

Within the Electron cloned directory:

```
npm run libchromium-build
npm run libchromium-bootstrap
```

Although checkout the actual package.json commands because you'll end up wanting to run things manually depending on what you change.

If you change a build related file (gyp, gypi) you'll want to run `../libchromiumcontent/script/update`.
If you change only a source file you just need to run `../libchromiumcontent/script/build && ../libchromiumcontent/script/create-dist --no_zip`.


### Debugging startup problems


To debug renderer, change browser-laptop's `tools/start.js`:

```
-execute('electron "' + path.join(__dirname, '..') + '" ' + process.argv.slice(2).join(' '), env)
+execute('electron --renderer-startup-dialog "' + path.join(__dirname, '..') + '" ' + process.argv.slice(2).join(' '), env)
```

It’ll print a message in console telling you the PIDs to attach to, in this case `83916`:

> [83916:0710/120909:ERROR:child_process.cc(136)] Renderer (83916) paused waiting for debugger to attach. Send SIGUSR1 to unpause.

### Creating a fresh brave-development profile

Using a simple shell script, a developer can easily create a fresh profile for their debugging needs:
```
./createFreshDevProfile.sh
```
Often times profiles can be useful towards re-creating simple bugs, to more complex ones which require a refreshed profile,
as if a user is logging in for the first time. 