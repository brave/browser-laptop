# Contribution guidelines

Table of contents
- [How can you contribute?](#how-can-you-contribute)
  - [Help triage issues](#help-triage-issues)
  - [Updating documentation](#updating-documentation)
  - [Help with translations](#help-with-translations)
  - [Work on the code](#work-on-the-code)
- [Getting started](#getting-started)
  - [Making changes](#making-changes)
  - [Pull requests](#pull-requests)
    - [Considerations before submitting a pull request](#considerations-before-submitting-a-pull-request)
    - [Each pull request should include](#each-pull-request-should-include)
    - [Employees should](#employees-should)
  - [Closing issues](#closing-issues)
  - [Triage help](#triage-help)

## How can you contribute?
Brave welcomes contributions of all kinds! You can make a huge impact without writing a single line of code

### Help triage issues
One of the easiest ways to help is to [look through our issues tab](https://github.com/brave/browser-laptop/issues)
* Does the issue still happen? Sometimes we fix the problem and don't always close the issue
* Are there clear steps to reproduce the issue? If not, let's find and document some
* Is the issue a duplicate? If so, share the issue that is being duplicated in the conversation
* See our [Triage of issues page](https://github.com/brave/browser-laptop/wiki/(WIP)-Triage-of-issues) for more info about this process

### Updating documentation
Documentation is extremely important. There are lots of areas we can improve:
* Having more clear or up-to-date instructions in our [README.md](https://github.com/brave/browser-laptop/blob/master/README.md).
* Capturing/updating helpful information [in our wiki](https://github.com/brave/browser-laptop/wiki). For example:
  * [Troubleshooting steps](https://github.com/brave/browser-laptop/wiki/Troubleshooting)
  * [Fingerprinting protection](https://github.com/brave/browser-laptop/wiki/Fingerprinting-Protection-Mode)
* Helping to propose a way to bring documentation to other languages. Right now, everything is in English
* Improving this document :smile:

### Help with translations
All text being added to Brave is done initially in English (en-US) and then is translated by real people into other languages.
We're missing translations for many languages and some translations are incomplete.

For everything you'd need to get started, see our [translations page](https://github.com/brave/browser-laptop/blob/master/docs/translations.md) :smile:

### Work on the code
* The [repo's README.md](https://github.com/brave/browser-laptop/blob/master/README.md) has basic instructions on getting your development environment setup
* Windows users will want to read the [Building on Windows](https://github.com/brave/browser-laptop/wiki/(setup)-Windows-build-guide) for specific details needed to get up and running
* Check out the [troubleshooting page](https://github.com/brave/browser-laptop/wiki/Troubleshooting) if you get stuck
* Once you're up and running, find an interesting issue to fix. Check out issues labelled with [good first bug](https://github.com/brave/browser-laptop/labels/bug%2Fgood-first-bug)

## Getting started
* Make sure you have a [GitHub account](https://github.com/signup/free).
* Submit a [ticket](https://github.com/brave/browser-laptop/issues) for your issue if one does not already exist. Please include the Brave version, operating system, and steps to reproduce the issue.
* Fork the repository on GitHub.
* For changes to JavaScript files, we recommend installing a [Standard](http://standardjs.com/) plugin for your preferred text editor in order to ensure code style consistency.

### Making changes
Once you've cloned the repo to your computer, you're ready to start making edits!
* Make a new branch for your work. It helps to have a descriptive name, like `fix-fullscreen-issue`.
* Make commits in logical units. If needed, run `git rebase -i` to squash commits before opening a pull request.
* New features and most other pull requests require a new [test](https://github.com/brave/browser-laptop/blob/master/docs/tests.md) to be written before the pull request will be accepted.  Some exceptions would be a tweak to an area of code that doesn't have tests yet, text changes, build config changes, things that can't be tested due to test suite limitations, etc.
* Use GitHub [auto-closing keywords](https://help.github.com/articles/closing-issues-via-commit-messages/) in the commit message, and make the commit message body as descriptive as necessary. Ex:

````
    Add contributing guide

    This is a first pass at a contributor's guide so now people will know how to
    get pull requests accepted faster.

    Fix #206
````

* Run the tests by running `npm run watch-test` and `npm test` in separate terminals.
* Make sure [Flow](http://flowtype.org/) type checking passes: `npm run-script flow`. BONUS: Help us out by adding more [Flow type annotations](http://flowtype.org/blog/2015/02/20/Flow-Comments.html) to new and existing Brave code!
* When making style changes, please be sure that you are [following our style guidelines](https://github.com/brave/browser-laptop/blob/master/docs/style.md).

### Pull requests
After the changes are made in your branch, you're ready to submit a patch. Patches on GitHub are submitted in the format of a pull request.

#### Considerations before submitting a pull request
Some helpful things to consider before submitting your work
* Did you manually test your new change?
* Does your pull request fix multiple issues? If so, you may consider breaking into separate pull requests.
* Did you include tests? (we currently have both unit tests and webdriver tests)
* If you made a design or layout change, was there a mock-up provided? Do your changes match it?
* If your change affects session, did you include steps to test? You may also consider manually testing an upgrade.

#### Each pull request should include
* a descriptive title; this gets used in the [release notes](https://github.com/brave/browser-laptop/releases/tag/0.11.6dev)
* a short summary of the changes
* a reference to the issue that it fixes
* steps to test the fix (if applicable)
* for design-related changes, it is helpful to include screenshots

Once you submit a pull request, you should tag reviewers and add labels to the pull request according to [this guide](https://github.com/brave/browser-laptop/wiki/Pull-request-process). If you do not have the necessary GitHub permissions to do so, a Brave member will take care of this for you.

Please note that your pull request will
be subject to our [reviewer guidelines](https://github.com/brave/browser-laptop/wiki/Reviewer-guideline), which you'll want to make
sure your PR meets.

#### Employees should
* Assign the issue being fixed to a milestone.
* Ensure the owner is tagged using the `Assignees` field
* Ensure at least one other employee or contributor is tagged using the `Reviewers` field
* Ensure the PR is approved before merging (see [`Reviewer guidelines`](https://github.com/brave/browser-laptop/wiki/Reviewer-guideline) for more information)
* Flag issues with `QA/test-plan-specified` if there are special things to test at the issue level. In particular you should always specify this if there’s an upgrade of the session store file.  It’s a signal to QA to make sure they pay extra special attention to this task.
* Follow the [pull request approval process](https://github.com/brave/browser-laptop/wiki/Pull-request-process).

### Closing issues

* Issues should be in a closed state exactly when the code for the fix is landed on master.
* Milestones should be added on issues for the Brave version it will be released in. This is usually the next version except when the code is frozen for that version, then it is often the second smallest version available.
* If an issue is closed without a fix, because it was a duplicate, or perhaps it was invalid, then any milestone markers should be removed.
* Follow-up issues should be created for follow-up issues, instead of re-opening an issue, unless the issue's code is reverted.

### Triage help

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
