// @flow
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const spellchecker = require('spellchecker')
const messages = require('../js/constants/messages')
const electron = require('electron')
const ipcMain = electron.ipcMain
const app = electron.app
const appStore = require('../js/stores/appStore')
const appActions = require('../js/actions/appActions')

// Stores a reference to the last added immutable words
let lastAddedWords

const isMisspelled = (word) =>
  !appStore.getState().getIn(['dictionary', 'ignoredWords']).includes(word) &&
  !appStore.getState().getIn(['dictionary', 'addedWords']).includes(word) &&
  spellchecker.isMisspelled(word)

module.exports.init = () => {
  ipcMain.on(messages.IS_MISSPELLED, (e, word) => {
    e.returnValue = isMisspelled(word)
  })
  ipcMain.on(messages.GET_MISSPELLING_INFO, (e, word) => {
    const misspelled = isMisspelled(word)
    e.returnValue = {
      isMisspelled: misspelled,
      suggestions: !misspelled ? [] : spellchecker.getCorrectionsForMisspelling(word)
    }
  })

  appStore.addChangeListener(() => {
    let addedWords = appStore.getState().getIn(['dictionary', 'addedWords'])
    if (lastAddedWords !== addedWords) {
      if (lastAddedWords) {
        addedWords = addedWords.splice(lastAddedWords.size)
      }
      addedWords.forEach(spellchecker.add.bind(spellchecker))
      lastAddedWords = appStore.getState().getIn(['dictionary', 'addedWords'])
    }
  })

  const availableDictionaries = spellchecker.getAvailableDictionaries()
  let dict = app.getLocale().replace('-', '_')
  let dictionaryLocale
  if (availableDictionaries.includes(dict)) {
    dictionaryLocale = dict
  } else {
    dict = app.getLocale().split('-')[0]
    if (availableDictionaries.includes(dict)) {
      dictionaryLocale = dict
    }
  }

  if (dictionaryLocale) {
    appActions.setDictionary(dictionaryLocale)
  }
}
