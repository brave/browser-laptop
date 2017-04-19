# Contribution guidelines

Brave welcomes contributions via [pull requests](https://github.com/brave/browser-laptop/pulls). Below are a few guidelines we ask of contributors:

## Before you make changes

* Submit a [ticket](https://github.com/brave/browser-laptop/issues) for your issue if one does not already exist. Please include the Brave version, operating system, and steps to reproduce the issue.
* For changes to JavaScript files, we recommend installing a [Standard](http://standardjs.com/) plugin for your preferred text editor in order to ensure code style consistency.

## Making changes

* Make commits in logical units. If needed, run `git rebase -i` to squash commits before opening a pull request.
* New features and most other pull requests require a new [test](https://github.com/brave/browser-laptop/blob/master/docs/tests.md) to be written before the pull request will be accepted.  Some exceptions would be a tweak to an area of code that doesn't have tests yet, text changes, build config changes, things that can't be tested due to test suite limitations, etc.
* Use Github [auto-closing keywords](https://help.github.com/articles/closing-issues-via-commit-messages/) in the commit message, and make the commit message body as descriptive as necessary. Ex:

````
    Add contributing guide

    This is a first pass at a contributor's guide so now people will know how to
    get pull requests accepted faster.

    Fix #206
````

* If you update the npm dependencies, run `npm shrinkwrap --dev` before committing changes.
* Run the tests by running `npm run watch-test` and `npm test` in separate terminals.
* Make sure [Flow](http://flowtype.org/) type checking passes: `npm run-script flow`. BONUS: Help us out by adding more [Flow type annotations](http://flowtype.org/blog/2015/02/20/Flow-Comments.html) to new and existing Brave code!
* When making style changes, please be sure that you are [following our style guidelines](https://github.com/brave/browser-laptop/blob/master/docs/style.md).

## Pull requests

### Each pull request should include

* a descriptive title; this gets used in the [release notes](https://github.com/brave/browser-laptop/releases/tag/0.11.6dev)
* a short summary of the changes
* a reference to the issue that it fixes
* steps to test the fix (if applicable)
* for design-related changes, it is helpful to include screenshots

Feel free to tag a Brave employee in the pull request to assign them to review your code.  Please note that your pull request will
be subject to our [reviewer guidelines](https://github.com/brave/browser-laptop/wiki/Reviewer-guideline), which you'll want to make
sure your PR meets.

### Employees should

* Assign the issue being fixed to a milestone.
* Ensure the owner is tagged using the `Assignees` field
* Ensure at least one other employee or contributor is tagged using the `Reviewers` field
* Ensure the PR is approved before merging (see [`Reviewer guidelines`](https://github.com/brave/browser-laptop/wiki/Reviewer-guideline) for more information)
* Flag issues with `qa-steps-specified` if there are special things to test at the issue level. In particular you should always specify this if there’s an upgrade of the session store file.  It’s a signal to QA to make sure they pay extra special attention to this task.

### Considerations before submitting a pull request

* If you made a design or layout change, was there a mock-up provided? Do your changes match it?
* Does your pull request fix multiple issues? If so, you may consider breaking into separate PRs.
* Did you include tests? (we currently have both unit tests and web driver tests)
* Did you manually test your new change?
* If your change affects session, did you include steps to test? You may also consider manually testing an upgrade.

## Closing issues

* Issues should be in a closed state exactly when the code for the fix is landed on master.
* Milestones should be added on issues for the Brave version it will be released in. This is usually the next version except when the code is frozen for that version, then it is often the second smallest version available.
* If an issue is closed without a fix, because it was a duplicate, or perhaps it was invalid, then any milestone markers should be removed.
* Follow-up issues should be created for follow-up issues, instead of re-opening an issue, unless the issue's code is reverted.

## Triage help

* Invalid bugs should be closed, tagged with invalid, or a comment should be added indicating that they should if you do not have permission.
* Asking for more detail in an issue when it is needed is helpful.
* Adding applicable labels to an issue is helpful.
* Adding and finding duplicates, and linking them together is helpful.
* Creating tracking issues for an area of work with multiple related issues is helpful.
* Calling out things which seem important for extra attention is helpful.
* Improving steps to reproduce is helpful.
* Testing and adding a comment with "Could not reproduce" if an issue seems obscure is helpful.
* Testing open pull requests. For example: `git fetch origin pull/1234/head:pr-1234 && checkout pr-1234`
* You can be granted write permission if you've helped a lot with triage by pinging @bbondy.
* Helping make sure issues have a clear and understandable name (ex: not something like "Brave is broken"
* The first comment in an issue ideally would have a clear description of the issue and describe the impact to users. Asking folks for screenshots, steps to reproduce, and more information is highly recommended so that the issue is as clear as possible.
* If the issue is a duplicate, please let the issue creator know in a polite way how they can follow and track progress of the parent issue (including an ETA if it's marked with a milestone).
