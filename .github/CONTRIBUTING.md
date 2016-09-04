# Contributing to browser-laptop

Brave welcomes contributions via [pull requests](https://github.com/brave/browser-laptop/pulls). Below are a few guidelines we ask of contributors:

## Before you make changes

* Submit a [ticket](https://github.com/brave/browser-laptop/issues) for your issue if one does not already exist. Please include the Brave version, operating system, and steps to reproduce the issue.
* For changes to JavaScript files, we recommend installing a [Standard](http://standardjs.com/) plugin for your preferred text editor in order to ensure code style consistency.

## Making changes

* Make commits in logical units. If needed, run `git rebase -i` to squash commits before opening a pull request.
* New features and most other pull requests require a new [test](https://github.com/brave/browser-laptop/blob/master/docs/tests.md) to be written before the pull request will be accepted.  Some exceptions would be a tweak to an area of code that doesn't have tests yet, text changes, build config changes, things that can't be tested due to test suite limitations, etc.
* Use Github [auto-closing keywords](https://help.github.com/articles/closing-issues-via-commit-messages/) in the commit message, and make the commit messsage body as descriptive as necessary. Ex:

````
    Add contributing guide

    This is a first pass at a contributor's guide so now people will know how to
    get pull requests accepted faster.

    Fix #206
````

* Run the tests by running `npm run watch-test` and `npm test` in separate terminals.
* Make sure [Flow](http://flowtype.org/) type checking passes: `npm run-script flow`. BONUS: Help us out by adding more [Flow type annotations](http://flowtype.org/blog/2015/02/20/Flow-Comments.html) to new and existing Brave code!

## Pull requests

### Each pull request should include

* a descriptive title; this gets used in the [release notes](https://github.com/brave/browser-laptop/releases/tag/0.11.6dev)
* a short summary of the changes
* a reference to the issue that it fixes
* steps to test the fix (if applicable)
* for design-related changes, it is helpful to include screenshots

Feel free to tag a Brave employee in the pull request to assign them to review your code.

### Employees should

* Assign the issue being fixed to a milestone.
* Ensure another employee is tagged in the PR to review the code, via the `Auditor: @username` syntax.
* Flag issues with `qa-steps-specified` if there are special things to test at the issue level. In particular you should always specify this if there’s an upgrade of the session store file.  It’s a signal to QA to make sure they pay extra special attention to this task.

### Considerations before submitting a pull request

* If you made a design or layout change, was there a mock-up provided? Do your changes match it?
* Does your pull request fix multiple issues? If so, you may consider breaking into separate PRs.
* Did you include tests? (we currently have both unit tests and web driver tests)
* Did you manually test your new change?
* If your change affects session, did you include steps to test? You may also consider manually testing an upgrade.
