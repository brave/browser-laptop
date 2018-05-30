/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const notifier = require('brave-node-notifier')
const os = require('os')

// Actions
const appActions = require('../../../js/actions/appActions')

// Constants
const notificationTypes = require('../../common/constants/notificationTypes')

// State
const windowState = require('../../common/state/windowState')

// Utils
const immutableUtil = require('../../common/state/immutableUtil')

const notificationUtil = {
  onClick: null,
  createNotification: (options) => {
    if (!options) {
      appActions.onUserModelLog('no notification options provided')
      console.error('no notification options provided')
      return
    }

    options = immutableUtil.makeJS(options)

    if (!options.title) {
      appActions.onUserModelLog('no notification title provided', options)
      console.error('no notification title provided')
      return
    }

    const type = os.type()
    let extras = {
      Linux: () => {
        // TBD: add NotifySend() options here
      },

      // Terminal.icns has been updated!
      Darwin: () => {
        if (notifier.utils.isMountainLion()) {
          return {
            actions: 'View',
            closeLabel: 'Close'
          }
        }
      },

      Windows_NT: () => {
        if (!notifier.utils.isLessThanWin8()) {
          return {
            appID: 'com.squirrel.brave.Brave'
          }
        }
      }
    }[type]

    if (extras) extras = extras()
    if (!extras) {
      appActions.onUserModelLog('notification not supported', { type: type })
      console.error('notifications not supported')
      return
    }

    if (!notificationUtil.onClick) {
      notificationUtil.onClick = notifier.on('click', function (notifierObject, options) {
        if (typeof options === 'object' && options.data) {
          notificationUtil.clickHandler(options)
        }
      })

      notifier.on('timeout', () => {
        if (typeof options === 'object' && options.data) {
          notificationUtil.timeoutHandler(options)
        }
      })
    }

    notifier.notify(Object.assign(options, extras), function () {
      let result = arguments[2] && arguments[2].activationType

      if (!result && arguments[1]) {
        result = {
          'the user clicked on the toast.': 'clicked',
          'the toast has timed out': 'timeout',
          'the user dismissed this toast': 'closed'
        }[arguments[1]]
      }
      if (!result) result = 'unknown'
      if (result.indexOf('Clicked') !== -1) result = 'clicked'
      if (result === 'timeout') result = 'ignored'

      let payload = { result: result }

      if (typeof options === 'object' && options.uuid) {
        payload.uuid = options.uuid
      }

      appActions.onUserModelLog(notificationTypes.NOTIFICATION_RESULT, payload)
    })
  },

  clickHandler: (options) => {
    const data = options.data

    let payload = { notificationUrl: data.notificationUrl }
    if (typeof options === 'object' && options.uuid && data.notificationId === notificationTypes.ADS) {
      payload.uuid = options.uuid
    }

    switch (data.notificationId) {
      case notificationTypes.ADS:
      case notificationTypes.SURVEY:
        {
          if (data.windowId === windowState.WINDOW_ID_NONE) {
            // FIXME
            appActions.onUserModelLog(notificationTypes.NOTIFICATION_CLICK, { data })
          }
          appActions.createTabRequested({
            url: data.notificationUrl,
            windowId: data.windowId
          })
          appActions.onUserModelLog(notificationTypes.NOTIFICATION_CLICK, payload)
          break
        }
    }
  },

  timeoutHandler: (options) => {
    const data = options.data

    let payload = { notificationUrl: data.notificationUrl }
    if (typeof options === 'object' && options.uuid && data.notificationId === notificationTypes.ADS) {
      payload.uuid = options.uuid
    }

    switch (data.notificationId) {
      case notificationTypes.ADS:
        {
          appActions.onUserModelLog(notificationTypes.NOTIFICATION_TIMEOUT, payload)
          break
        }
    }
  }
}

module.exports = notificationUtil
