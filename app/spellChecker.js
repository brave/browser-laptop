/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const session = electron.session

module.exports.addWord = (word) => {
  session.defaultSession.spellChecker.addWord(word)
}

module.exports.removeWord = (word) => {
  session.defaultSession.spellChecker.removeWord(word)
}
