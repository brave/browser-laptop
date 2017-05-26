/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const keytar = require('keytar')
const appConstants = require('../../../js/constants/appConstants')
const appActions = require('../../../js/actions/appActions')
const CryptoUtil = require('../../../js/lib/cryptoUtil')
const locale = require('../../locale')
const messages = require('../../../js/constants/messages')
const {getWebContents} = require('../webContentsCache')
const {makeImmutable} = require('../../common/state/immutableUtil')
const Immutable = require('immutable')
const {ipcMain} = require('electron')
const autofill = require('../../autofill')

const unsafeTestMasterKey = 'c66af15fc6555ebecf7cee3a5b82c108fd3cb4b587ab0b299d28e39c79ecc708'

// Don't show the keytar prompt more than once per 24 hours
let throttleKeytar = false

// Map of password notification bar messages to their callbacks
const passwordCallbacks = {}

let masterKey

/**
 * Gets the master key for encrypting login credentials from the OS keyring.
 */
const getMasterKey = () => {
  if (throttleKeytar) {
    return null
  }

  if (process.env.NODE_ENV === 'test') {
    // workaround for https://travis-ci.org/brave/browser-laptop/builds/132700770
    return (new Buffer(unsafeTestMasterKey, 'hex')).toString('binary')
  }

  const appName = 'Brave'
  // Previously the master key was binary encoded, which caused compatibility
  // issues with various keyrings. In 0.8.3, switch to hex encoding for storage.
  const oldAccountName = 'login master key'
  const accountName = 'login master key v2'
  let oldMasterKey = keytar.getPassword(appName, oldAccountName)
  let masterKey = keytar.getPassword(appName, accountName)

  let success = false

  if (masterKey === null) {
    if (typeof oldMasterKey === 'string') {
      // The user made a v1 (binary) key. Try converting it to hex if it
      // appears to be 32 bytes.
      let oldBuffer = new Buffer(oldMasterKey, 'binary')
      if (oldBuffer.length === 32) {
        success = keytar.addPassword(appName, accountName, oldBuffer.toString('hex'))
      }
    }

    // Either the user denied access or no master key has ever been created.
    // We can't tell the difference so try making a new master key.
    success = success || keytar.addPassword(appName, accountName, CryptoUtil.getRandomBytes(32).toString('hex'))

    if (success) {
      // A key should have been created
      masterKey = keytar.getPassword(appName, accountName)
    }
  }

  if (typeof masterKey === 'string') {
    // Convert from hex to binary
    return (new Buffer(masterKey, 'hex')).toString('binary')
  } else {
    throttleKeytar = true
    setTimeout(() => {
      throttleKeytar = false
    }, 1000 * 60 * 60 * 24)
    return null
  }
}

const init = () => {
  ipcMain.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex, persist) => {
    if (passwordCallbacks[message]) {
      passwordCallbacks[message](buttonIndex)
    }
  })
}

const savePassword = (username, origin, tabId) => {
  if (!origin) {
    return
  }

  var message = username
    ? locale.translation('notificationPasswordWithUserName').replace(/{{\s*username\s*}}/, username).replace(/{{\s*origin\s*}}/, origin)
    : locale.translation('notificationPassword').replace(/{{\s*origin\s*}}/, origin)

  if (!(message in passwordCallbacks)) {
    // Notification not shown already
    appActions.showNotification({
      buttons: [
        {text: locale.translation('yes')},
        {text: locale.translation('no')},
        {text: locale.translation('neverForThisSite')}
      ],
      options: {
        persist: false,
        advancedText: locale.translation('notificationPasswordSettings'),
        advancedLink: 'about:passwords'
      },
      message
    })
  }

  const webContents = getWebContents(tabId)

  passwordCallbacks[message] = (buttonIndex) => {
    delete passwordCallbacks[message]
    appActions.hideNotification(message)

    if (buttonIndex === 1) {
      // don't save
      return
    }
    if (buttonIndex === 2) {
      // never save
      webContents.neverSavePassword()
      return
    }

    // save password
    webContents.savePassword()
  }
}

const updatePassword = (username, origin, tabId) => {
  if (!origin) {
    return
  }

  var message = username
    ? locale.translation('notificationUpdatePasswordWithUserName').replace(/{{\s*username\s*}}/, username).replace(/{{\s*origin\s*}}/, origin)
    : locale.translation('notificationUpdatePassword').replace(/{{\s*origin\s*}}/, origin)

  if (!(message in passwordCallbacks)) {
    // Notification not shown already
    appActions.showNotification({
      buttons: [
        {text: locale.translation('yes')},
        {text: locale.translation('no')}
      ],
      options: {
        persist: false,
        advancedText: locale.translation('notificationPasswordSettings'),
        advancedLink: 'about:passwords'
      },
      message
    })
  }

  const webContents = getWebContents(tabId)

  passwordCallbacks[message] = (buttonIndex) => {
    delete passwordCallbacks[message]
    appActions.hideNotification(message)

    if (buttonIndex === 0) {
      webContents.updatePassword()
      return
    }
    // never save
    webContents.noUpdatePassword()
  }
}

const removePassword = (form) => {
  autofill.removeLogin(form)
}

const removePasswordSite = (form) => {
  let newForm = form
  delete newForm['blacklisted_by_user']
  autofill.updateLogin(newForm)
}

const clearPasswords = () => {
  autofill.clearLogins()
}

const migrate = (state) => {
  const passwords = state.get('passwords')
  if (passwords.size) {
    masterKey = masterKey || getMasterKey()
    if (!masterKey) {
      console.log('Could not access master password; aborting')
      return
    }
    passwords.forEach((password) => {
      let decrypted = CryptoUtil.decryptVerify(password.get('encryptedPassword'),
                                               password.get('authTag'),
                                               masterKey,
                                               password.get('iv'))
      if (decrypted) {
        let form = {}
        form['origin'] = password.get('origin')
        form['signon_realm'] = password.get('origin') + '/'
        form['action'] = password.get('action')
        form['username'] = password.get('username')
        form['password'] = decrypted
        autofill.addLogin(form)
      }
    })
    state = state.set('legacyPasswords', state.get('passwords'))
    state = state.set('passwords', new Immutable.List())
  }
  const allSiteSettings = state.get('siteSettings')
  const blackedList = allSiteSettings.filter((setting) => setting.get('savePasswords') === false)
  if (blackedList.size) {
    blackedList.forEach((entry, index) => {
      let form = {}
      form['origin'] = index
      form['signon_realm'] = index + '/'
      form['blacklisted_by_user'] = true
      autofill.addLogin(form)
      appActions.deletePasswordSite(index)
    })
  }
  return state
}

const passwordManagerReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE:
      init()
      state = migrate(state)
      break
    case appConstants.APP_SAVE_PASSWORD:
      savePassword(action.get('username'), action.get('origin'), action.get('tabId'))
      break
    case appConstants.APP_UPDATE_PASSWORD:
      updatePassword(action.get('username'), action.get('origin'), action.get('tabId'))
      break
    case appConstants.APP_REMOVE_PASSWORD:
      removePassword(action.get('passwordDetail').toJS())
      break
    case appConstants.APP_REMOVE_PASSWORD_SITE:
      removePasswordSite(action.get('passwordDetail').toJS())
      break
    case appConstants.APP_CLEAR_PASSWORDS:
      clearPasswords()
      break
  }
  return state
}

module.exports = passwordManagerReducer
