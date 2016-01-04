#Debugging

## Debugging the Render processes

Most of the time you'll be debugging the render process and this can be done with the built in developer tools.
To open the dev tools use `Command+Alt+J` on OS X or `Control+Alt+J` on Windows.

If you've ever used the built in Chrome developer tools you'll be right at home with a DOM inspector, Network monitor, Sources debugging, Timeline, Resources, Audits, and Console.

The code which runs in render processes is inside of the `js` directory.

Calls to `console.log` and related functions go into the dev tools console mentioned above.

If you're running `npm run watch`, then webpack dev server will ensure that changes to source code will reload the app.

## Debugging the Main process

The main process can be debugged with remote developer tools.

When you run the `npm start` command it will start listening on port `5858`.
One easy way to start debugging is to `Attach` to the process using [Visual Studio Code](https://code.visualstudio.com/) which works for OS X, Windows, and Linux.

The left hand side of Visual Studio Code has a Debug button.  It allows you to attach the debugging, inspect variables, have a watch window, call stacks, line by line debugging, etc.

To pause the application before any code runs you can use `npm run start-brk`.

The code which runs in the main process is inside of the `app` directory.

Calls to `console.log` and related functions go into the terminal you did `npm start` from.

Unlike with the renderer process, since the main process isn't using webpack dev server, you will need to manually restart the app to see your changes.

## Debugging Content

Content is the web page which is loaded.  You can open the loaded content dev tools using `Command+Shift+I` on OS X or `Control+Shift+I` on Windows.

If you'd like to see code run on each page load, you can edit `app/content/webviewPreload.js`.

Calls to `console.log` and related functions go into the per page dev tools console mentioned above.
