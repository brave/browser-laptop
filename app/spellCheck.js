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
const contractionSet = new Set()
const getSetting = require('../js/settings').getSetting
const settings = require('../js/constants/settings')

let dictionaryLocale

// Stores a reference to the last added immutable words
let lastAddedWords

const isMisspelled = (word) =>
  !appStore.getState().getIn(['dictionary', 'ignoredWords']).includes(word) &&
  !appStore.getState().getIn(['dictionary', 'addedWords']).includes(word) &&
  spellchecker.isMisspelled(word)

module.exports.init = () => {
  ipcMain.on(messages.IS_MISSPELLED, (e, word) => {
    let misspelled = isMisspelled(word)
    // If the word is misspelled and it's English, then make sure it's nt a contraction.
    if (misspelled && (!dictionaryLocale || dictionaryLocale.includes('en'))) {
      misspelled = !contractionSet.has(word)
    }
    e.returnValue = misspelled
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

  // Thank you Slack team.
  // NB: This is to work around tinyspeck/slack-winssb#267, where contractions
  // are incorrectly marked as spelling errors. This lets people get away with
  // incorrectly spelled contracted words, but it's the best we can do for now.
  const contractions = [
    "ain't", "aren't", "can't", "could've", "couldn't", "couldn't've", "didn't", "doesn't", "don't", "hadn't",
    "hadn't've", "hasn't", "haven't", "he'd", "he'd've", "he'll", "he's", "how'd", "how'll", "how's", "I'd",
    "I'd've", "I'll", "I'm", "I've", "isn't", "it'd", "it'd've", "it'll", "it's", "let's", "ma'am", "mightn't",
    "mightn't've", "might've", "mustn't", "must've", "needn't", "not've", "o'clock", "shan't", "she'd", "she'd've",
    "she'll", "she's", "should've", "shouldn't", "shouldn't've", "that'll", "that's", "there'd", "there'd've",
    "there're", "there's", "they'd", "they'd've", "they'll", "they're", "they've", "wasn't", "we'd", "we'd've",
    "we'll", "we're", "we've", "weren't", "what'll", "what're", "what's", "what've", "when's", "where'd",
    "where's", "where've", "who'd", "who'll", "who're", "who's", "who've", "why'll", "why're", "why's", "won't",
    "would've", "wouldn't", "wouldn't've", "y'all", "y'all'd've", "you'd", "you'd've", "you'll", "you're", "you've"
  ]
  contractions.forEach((word) => contractionSet.add(word.replace(/'.*/, '')))

  const availableDictionaries = spellchecker.getAvailableDictionaries()
  let dict = (getSetting(settings.LANGUAGE) || app.getLocale()).replace('-', '_')
  if (availableDictionaries.includes(dict)) {
    dictionaryLocale = dict
    spellchecker.setDictionary(dict)
  } else {
    dict = dict.split('_')[0]
    if (availableDictionaries.includes(dict)) {
      dictionaryLocale = dict
      spellchecker.setDictionary(dict)
    }
  }

  if (dictionaryLocale) {
    appActions.setDictionary(dictionaryLocale)
  }
}
