# How to contribute translations

There are several things you can do to help us internationalize Brave and provide a great experience for everybody

## Providing a translation

We manage all of our translations using Transifex. Here's how you can get started:
- [Create an account](https://www.transifex.com/signup/?join_project=brave-laptop) with Transifex (it's free!)
- During the setup, it'll ask if you want to start your own project or join an existing project. Choose to join an existing project.
- Transifex will ask which languages you speak; filling this in is appreciated so that we have an accurate snapshot of the languages our contributors are familiar with.
- At this point, your account will be created and you can confirm your email.

At this point, you are ready to join and help with translations or you can request a language.
- Visit https://www.transifex.com/brave/brave-laptop/
- In the top right, you can click "Join team".
- You can specify the lanaguages you speak OR request a language which is not currently provided
- One of our contributors will be able to approve your access.

## How does translated text get back into the GitHub repository?
We generally pull in all languages files at the time we cut a release. That allows us to keep everything up to date in a scalable way.
For reference, here are a few pull requests where we've pulled in new language files:

- https://github.com/brave/browser-laptop/pull/3957
- https://github.com/brave/browser-laptop/pull/1826
- https://github.com/brave/browser-laptop/pull/1436

## Making sure our code has all strings localized

Besides providing the actual translations themselves, it's important that the code tokenizes all strings shown to the user.

### Fixing existing known issues

You can search our existing issues and find places to contribute here:
https://github.com/brave/browser-laptop/labels/l10n

### Properly adding a new string

When a new string is added, we'll add it for the `en_US` locale. You can find the .properties files here:
https://github.com/brave/browser-laptop/tree/master/app/extensions/brave/locales/en-US

The strings there are in camel-case a format like this:
tokenNameHere=Value in English here

Different files are used by different parts of the code. If you're not sure which file to edit, you do a search or grep using
another string in the same code you're looking at. For menu items and context menu items, you'll also have to add an entry here:
https://github.com/brave/browser-laptop/blob/master/app/locale.js

### Referencing that new string
In JSX, you can reference the string like so:
`<div data-l10n-id='tokenNameHere' />

Inside your JavaScript, you can get the localized values like so:
```
const locale = require('../js/l10n') // NOTE: path will change; it's located at `./js/l10n`

...

function exampleMethod () {
  const translatedString = locale.translation('tokenNameHere')
  console.log('the translated string is: "' + translatedString + '"')
}
```
