# Tests

## About tests

Tests use the [mocha test framework](https://mochajs.org/). Start by installing mocha globally:

    npm install --global mocha

Most tests use [webdriver.io](http://webdriver.io/) framework (via [Spectron](https://github.com/electron/spectron)) to bring up the browser and run through the tests.
Please [check out the API documentation](http://webdriver.io/api.html) for a comprehensive list of commands we can use in our tests.

Tests are located in the top level `test` directory and their filenames have a suffix of `Test.js`.

## Watching for changes for tests

To stay close to production, tests do not use the webpack dev server.  To keep the webpack bundle up to date as you make changes you should run:

    npm run watch-test

## Running all tests
You can run ALL of the tests using:

    npm run test

If you'd prefer to only run the unit tests, you can do that using:

    npm run unittest

If you only need to run the Spectron tests (used for UI testing), you can run:

    npm run uitest

## Running a subset of tests

You can run a subset of tests which match a `description` or `it` with:

    npm run test -- --grep="expression"

Where `expression` could be for example `^tabs` to match all tests which start with the word tabs. This works for all testing modes (test, unittest, uitest).

## Best practices for writing tests

- If you do anything that opens a new tab, you have to validate that the tab has opened before trying to switch to
another tab/window. This is the most common cause of race conditions that I find in tests. webdriver automatically
switches contexts to any new "window" that is created. chromedriver can’t differentiate between tabs and windows in
brave which is why we have special helpers. If there is more than one tab with the same url, you can’t use waitForUrl:
it will return on the tab/window that already exists and not wait for the new one. `getTabCount` is a good alternative
because it doesn’t require a particular window context to run

- Don’t try to interact with any dom element (click, moveTo, etc…) until you have verified that it exists.
Verifying the page or some parent element is not sufficient

- Avoid using external sites unless it’s **absolutely necessary**. For example where we need to do this: the httpse and
other ssl related tests make external calls because we don’t current have ssl capabilities on the test server.

  Adding an external dependency causes these issues:
    - tests will run slower since external requests need to be made
    - tests are not runnable if network is down
    - if the site's content changes, the test will break

- Never assume your tests will run in a particular order. Before each test is run, you should do the setup or cleanup
required in order for the test to run properly.

- Where it makes sense, prefer to use a before() instead of beforeEach(). Because the webdriver initialization takes
a while, having it set up once and being able to run multiple tests is going to help speed things up. Please note that
this isn't always an option though, because the test might alter the environment in a way that you need to redo the setup
(in which case a beforeEach() OR moving that test into it's own describe()/before() is a better choice).

## Useful helper methods

These are methods we own which can be used along side the [existing web driver methods](http://webdriver.io/api.html).
Please note that it's fairly easy to add new helper methods. For more info, please check out the addCommands()
method in at [brave.js](https://github.com/brave/browser-laptop/blob/master/test/lib/brave.js).

### IPC

- ipcSend: send an IPC message, like SHORTCUT_NEW_FRAME, etc. To see more message types, check out componentDidMount in [main.js](https://github.com/brave/browser-laptop/blob/master/js/components/main.js)
- ipcSendRenderer

### Tab management

- tabHandles
- tabByIndex
- getTabCount
- tabByUrl

### Window management
- waitForBrowserWindow
- setContextMenuDetail: hides any context menus which are actively showing
- showFindbar
- setPinned
- getDefaultWindowHeight
- getDefaultWindowWidth
- resizeWindow
- windowParentByUrl
- windowByUrl

### State management
- getAppState
- getWindowState

### Site management
- addSite: add a bookmark/folder or history entry
- addSiteList
- removeSite

### Preferences
- changeSetting
- changeSiteSetting

and many more! If you're not sure how to use the methods, search our existing tests to find an example.

Please note that many of these methods do NOT wait until the action is complete. Until the helper methods
are updated, you'll have to ensure of this in the test. [Click here to see a good example](https://github.com/brave/browser-laptop/commit/f78430c6e9eed74d4f6c42a2fbed9bb97900de04#diff-a7970760e9f2ed32f13f98921d9f94cdL313)
which presented itself with intermittent failures (because sometimes action would be complete, sometimes it wouldn't).
In the example linked to above, the condition is tested by waiting until the tab count increases (which means
the IPC message was received and processed).

## Debugging tests

You can debug tests by using the command `yield this.app.client.debug()` in a test.
Or most of the time just append `.debug()` to a series of commands.

This will pause the browser from running tests, and you can open up browser dev tools or content dev tools to inspect logs, console, and other things.
You should act fast or else adjust the timeout or the test will fail though.

To get browser process logs just do `git grep this.app.client.getMainProcessLogs` and uncomment that block of code.
