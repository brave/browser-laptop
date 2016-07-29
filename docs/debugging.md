#Debugging

## Debugging the Render processes

Most of the time you'll be debugging the render process and this can be done with the built in developer tools.
To open the dev tools use `Shift+F8`.

If you've ever used the built in Chrome developer tools you'll be right at home with a DOM inspector, Network monitor, Sources debugging, Timeline, Resources, Audits, and Console.

The code which runs in render processes is inside of the `js` directory.

Calls to `console.log` and related functions go into the dev tools console mentioned above.

If you're running `npm run watch`, then webpack dev server will ensure that changes to source code will reload the app.

## Debugging the Main process

The main process can be debugged with remote developer tools.

When you run the `npm start` command it will start listening on port `5858`.
One easy way to start debugging is to `Attach` to the process using [Visual Studio Code](https://code.visualstudio.com/) which works for macOS, Windows, and Linux.

The left hand side of Visual Studio Code has a Debug button.  It allows you to attach the debugging, inspect variables, have a watch window, call stacks, line by line debugging, etc.

To pause the application before any code runs you can use `npm run start-brk`.

The code which runs in the main process is inside of the `app` directory.

Calls to `console.log` and related functions go into the terminal you did `npm start` from.

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
