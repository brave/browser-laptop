/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const appActions = require('../../../js/actions/appActions')
const locale = require('../../locale')
const messages = require('../../../js/constants/messages')
const {getWebContents} = require('../webContentsCache')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {ipcMain} = require('electron')
const autofill = require('../../autofill')

// Map of password notification bar messages to their callbacks
const passwordCallbacks = {}

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

  const message = username
    ? locale.translation('notificationPasswordWithUserName').replace(/{{\s*username\s*}}/, username).replace(/{{\s*origin\s*}}/, origin)
    : locale.translation('notificationPassword').replace(/{{\s*origin\s*}}/, origin)

  if (!(message in passwordCallbacks)) {
    // Notification not shown already
    appActions.showNotification({
      buttons: [
        {text: locale.translation('allow')},
        {text: locale.translation('deny')},
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
    const webContents = getWebContents(tabId)

    delete passwordCallbacks[message]
    appActions.hideNotification(message)

    if (buttonIndex === 1) {
      // don't save
      return
    }
    if (buttonIndex === 2) {
      if (webContents && !webContents.isDestroyed()) {
        // never save
        webContents.neverSavePassword()
      }
      return
    }

    if (webContents && !webContents.isDestroyed()) {
      // save password
      webContents.savePassword()
    }
  }
}

const updatePassword = (username, origin, tabId) => {
  if (!origin) {
    return
  }

  const message = username
    ? locale.translation('notificationUpdatePasswordWithUserName').replace(/{{\s*username\s*}}/, username).replace(/{{\s*origin\s*}}/, origin)
    : locale.translation('notificationUpdatePassword').replace(/{{\s*origin\s*}}/, origin)

  if (!(message in passwordCallbacks)) {
    // Notification not shown already
    appActions.showNotification({
      buttons: [
        {text: locale.translation('allow')},
        {text: locale.translation('deny')}
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
    const webContents = getWebContents(tabId)

    delete passwordCallbacks[message]
    appActions.hideNotification(message)

    if (buttonIndex === 0) {
      if (webContents && !webContents.isDestroyed()) {
        webContents.updatePassword()
      }
      return
    }
    if (webContents && !webContents.isDestroyed()) {
      // never save
      webContents.noUpdatePassword()
    }
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

const passwordManagerReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE:
      init()
      // Log a warning if they are updating from <0.15.300 to 0.21 or higher
      if (state.getIn(['passwords', 0])) {
        console.warn('Warning: unable to migrate old passwords.')
      }
      // legacyPasswords was added in 0.15.300 to backup old passwords in case
      // the migration failed
      if (state.get('legacyPasswords')) {
        state = state.delete('legacyPasswords')
      }
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
