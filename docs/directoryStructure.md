#Directory Structure

- `app`: Container for all app runtime code
  - `browser`: Code that runs in the main process. This includes the top level menu, shortcut handling, and contains other resources which need to be accessed from the main process. Files in this directory can use `require('electron')` for most electron APIs and `ipcMain` for IPC calls.
  - `renderer`: Code that runs in the renderer processes. It should be primarily UI related code for the main browser windows. Files in this directory must use `global.require('electron').remote` and for most electron APIs and `ipcRenderer` for IPC calls.
  - `common`: Code that is shared by the browser and renderer process. This includes things like utility functions, constants and actions. Stores can live in either the browser or the renderer process, but should not be shared becuase the renderer processes are short-lived compared to the browser process and therefore won't receive the same set of updates. Files in the common directory should avoid using electron APIs, but if it is necessary they must do a process type check and either `require('electron')` or `global.require('electron').remote` as appropriate.

#Deprecated Directory Structure
- `app`: Code that runs in the main process. This includes the top level menu, shortcut handling, and contains other resources which need to be accessed from the main process.
  - `content`: Content scripts which run in content of webpages before the actual web pages load.  They need to be accessible outside of webpack by the main process, they are a bit out of place here.
  - `ext`: Third party resources which are excluded from the linter.

- `docs`: Documentation on various topics.
- `js`: Code that is bundled by webpack and runs in the render process.  Each `BrowserWindow` mounts its own component tree.

  - `actions`: Actions to perform, some examples include: creating a new frame, focusing the navigation bar, creating a new window.  These actions are usually fairly simple and dispatch the work somewhere.
  - `constants`: Various top level constants.  For example each action has a constant ID associated with it.
  - `components`: Immutable React components. Components are allowed to read data directly from `stores` but cannot modify it directly.  Instead they must use one of the `actions` to do that.
  - `data`: Static data files such as the Alexa top 500.
  - `dispatcher`: Dispatcher code for communication with one of the `stores`.  This is mostly boilerplate code similar to the Flux demos.  The dispatcher is often used by the `actions` to dispatch actions to the `stores`.
  - `lib`: Various helper modules mostly used by the `components`.
  - `stores`: Stores which contain and modify the application state.  Responds to actions from the dispatcher and emits change events which the top level React component listens to.
  - `state`: Functions used by the `stores` to manage state and sometimes directly by the `components` to read state.

- `less`: stylesheets written in LESS.
- `res`: Images, icons, and other binary resources.
