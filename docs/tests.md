# Tests

## About tests

Tests use the [mocha test framework](https://mochajs.org/).

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
