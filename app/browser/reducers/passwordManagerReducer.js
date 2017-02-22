/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const keytar = require('keytar')
const appConstants = require('../../../js/constants/appConstants')
const appActions = require('../../../js/actions/appActions')
const AppStore = require('../../../js/stores/appStore')
const CryptoUtil = require('../../../js/lib/cryptoUtil')
const locale = require('../../locale')
const messages = require('../../../js/constants/messages')
const siteSettings = require('../../../js/state/siteSettings')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {BrowserWindow, ipcMain} = require('electron')

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

  ipcMain.on(messages.DECRYPT_PASSWORD, (e, encrypted, authTag, iv, id) => {
    masterKey = masterKey || getMasterKey()
    if (!masterKey) {
      console.log('Could not access master password; aborting')
      return
    }
    let decrypted = CryptoUtil.decryptVerify(encrypted, authTag, masterKey, iv)
    e.sender.send(messages.DECRYPTED_PASSWORD, {
      id,
      decrypted
    })
  })

  ipcMain.on(messages.GET_PASSWORDS, (e, origin, action) => {
    const passwords = AppStore.getState().get('passwords')
    if (!passwords || passwords.size === 0) {
      return
    }

    let results = passwords.filter((password) => {
      return password.get('origin') === origin && password.get('action') === action
    })

    if (results.size === 0) {
      return
    }

    masterKey = masterKey || getMasterKey()
    if (!masterKey) {
      console.log('Could not access master password; aborting')
      return
    }

    let isUnique = results.size === 1
    results.forEach((result) => {
      let password = CryptoUtil.decryptVerify(result.get('encryptedPassword'),
                                              result.get('authTag'),
                                              masterKey,
                                              result.get('iv'))
      e.sender.send(messages.GOT_PASSWORD, result.get('username'),
                    password, origin, action, isUnique)
    })
  })

  ipcMain.on(messages.SHOW_USERNAME_LIST, (e, origin, action, boundingRect, value) => {
    const passwords = AppStore.getState().get('passwords')
    if (!passwords || passwords.size === 0) {
      return
    }

    let usernames = {}
    let results = passwords.filter((password) => {
      return password.get('username') &&
        password.get('username').startsWith(value) &&
        password.get('origin') === origin &&
        password.get('action') === action
    })

    if (results.size === 0) {
      if (BrowserWindow.getFocusedWindow()) {
        BrowserWindow.getFocusedWindow().webContents.send(messages.HIDE_CONTEXT_MENU)
      }
      return
    }

    masterKey = masterKey || getMasterKey()
    if (!masterKey) {
      console.log('Could not access master password; aborting')
      return
    }

    results.forEach((result) => {
      usernames[result.get('username')] = CryptoUtil.decryptVerify(result.get('encryptedPassword'),
                                                                   result.get('authTag'),
                                                                   masterKey,
                                                                   result.get('iv')) || ''
    })
    let win = BrowserWindow.getFocusedWindow()
    if (!win) {
      return
    }
    if (Object.keys(usernames).length > 0) {
      win.webContents.send(messages.SHOW_USERNAME_LIST,
                           usernames, origin, action,
                           boundingRect)
    } else {
      win.webContents.send(messages.HIDE_CONTEXT_MENU)
    }
  })

  ipcMain.on(messages.SAVE_PASSWORD, (e, username, password, origin, action) => {
    if (!password || !origin || !action) {
      return
    }
    const originSettings = siteSettings.getSiteSettingsForURL(AppStore.getState().get('siteSettings'), origin)
    if (originSettings && originSettings.get('savePasswords') === false) {
      return
    }

    masterKey = masterKey || getMasterKey()
    if (!masterKey) {
      console.log('Could not access master password; aborting')
      return
    }

    const passwords = AppStore.getState().get('passwords')

    // If the same password already exists, don't offer to save it
    let result = passwords.findLast((pw) => {
      return pw.get('origin') === origin && pw.get('action') === action && (username ? pw.get('username') === username : !pw.get('username'))
    })
    if (result && password === CryptoUtil.decryptVerify(result.get('encryptedPassword'),
                                                        result.get('authTag'),
                                                        masterKey,
                                                        result.get('iv'))) {
      return
    }

    var message = username
      ? locale.translation('notificationPasswordWithUserName').replace(/{{\s*username\s*}}/, username).replace(/{{\s*origin\s*}}/, origin)
      : locale.translation('notificationPassword').replace(/{{\s*origin\s*}}/, origin)

    if (!(message in passwordCallbacks)) {
      // Notification not shown already
      appActions.showMessageBox({
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

    passwordCallbacks[message] = (buttonIndex) => {
      delete passwordCallbacks[message]
      appActions.hideMessageBox(message)

      if (buttonIndex === 1) {
        return
      }
      if (buttonIndex === 2) {
        // Never save the password on this site
        appActions.changeSiteSetting(origin, 'savePasswords', false)
        return
      }

      // Save the password
      const encrypted = CryptoUtil.encryptAuthenticate(password, masterKey)
      appActions.savePassword({
        origin,
        action,
        username: username || '',
        encryptedPassword: encrypted.content,
        authTag: encrypted.tag,
        iv: encrypted.iv
      })
    }
  })
}

const passwordManagerReducer = (state, action) => {
  action = makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE:
      init()
      break
  }
  return state
}

module.exports = passwordManagerReducer
