# Contributing to browser-laptop

Brave welcomes contributions via [pull requests](https://github.com/brave/browser-laptop/pulls). Below are a few guidelines we ask of contributors:

## Before you make changes

* Submit a [ticket](https://github.com/brave/browser-laptop/issues) for your issue if one does not already exist. Please include the Brave version, operating system, and steps to reproduce the issue. Note that this is not necessary for trivial changes (spelling fixes, minor documentation changes, etc).
* For changes to javascript files, we recommend installing a [Standard](http://standardjs.com/) plugin for your preferred text editor in order to ensure code style consistency.

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

Feel free to tag a Brave employee in the pull request to assign them to review your code. For design-related changes, it is helpful to include screenshots.
