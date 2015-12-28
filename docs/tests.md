# Tests

## About tests

Tests use the [mocha test frameowrk](https://mochajs.org/).

Most tests use [webdriver.io](http://webdriver.io/) to bring up the browser and run through the tests.

Tests are located in the top level `test` directory and their filenames have a suffix of `Test.js`.

## Watching for changes for tests

To stay close to production, tests do not use the webpack dev server.  To keep the webpack bundle up to date as you make changes you should run:

    npm run watch-test

## Running all tests

    npm run test

## Running a subset of tests

You can run a subset of tests which match a `description` or `it` with:

    npm run test -- --grep="expression"

Where `expression` could be for example `^tabs` to match all tests which start with the word tabs.
