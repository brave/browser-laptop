# Tests

## About tests

Tests use the [mocha test framework](https://mochajs.org/). Start by installing mocha globally:

    npm install --global mocha

Most tests use [webdriver.io](http://webdriver.io/) framework (via [Spectron](https://github.com/electron/spectron) to bring up the browser and run through the tests.

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

## Debugging tests

You can debug tests by using the command `yield this.app.client.debug()` in a test.
Or most of the time just append `.debug()` to a series of commands.

This will pause the browser from running tests, and you can open up browser dev tools or content dev tools to inspect logs, console, and other things.
You should act fast or else adjust the timeout or the test will fail though.

To get browser process logs just do `git grep this.app.client.getMainProcessLogs` and uncomment that block of code.
