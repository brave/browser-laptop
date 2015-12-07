#Debugging

##Debugging the Render processes

Most of the time you'll be debugging the render process and this can be done with the built in developer tools.
To open the dev tools use `Command+Shift+J` on OS X or `Control+Shift+J` on Windows.

If you've ever used the built in Chrome developer tools you'll be right at home with a DOM inspector, Network monitor, Sources debugging, Timeline, Resources, Audits, and Console.

The code which runs in render processes is inside of the `js` directory.

##Debugging the Main process

The main process can be debugged with remote developer tools.

When you run the `npm start` command it will start listening on port `5858`.
One easy way to start debugging is to `Attach` to the process using [Visual Studio Code](https://code.visualstudio.com/) which works for OS X, Windows, and Linux.

The left hand side of Visual Studio Code has a Debug button.  It allows you to attach the debugging, inspect variables, have a watch window, call stacks, line by line debugging, etc.

To pause the application before any code runs you can use `npm run start-brk`.

The code which runs in the main process is inside of the `app` directory.
