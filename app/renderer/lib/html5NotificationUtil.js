/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global Notification */

// Actions
const appActions = require('../../../js/actions/appActions')

// Utils
const immutableUtil = require('../../common/state/immutableUtil')

const html5NotificationUtil = {
  createNotification: (title, options, timeout) => {
    if (!title) throw new Error('title is not provided for the notification')

    options = immutableUtil.makeJS(options)
    if (!options.data) options.data = {}
    options.data.reason = 'timeout'

    const notification = new Notification(title, options)

    notification.addEventListener('show', (e) => {
      setTimeout(notification.close.bind(notification), timeout >= 5000 ? timeout : 5 * 1000)
    })

    notification.addEventListener('error', (e) => {
      options.data.reason = 'error'
    })

    notification.addEventListener('click', (e) => {
      options.data.reason = 'click'
    })

    notification.addEventListener('close', (e) => {
      if (!options.uuid) options.uuid = options.data.uuid
      appActions.onHtml5NotificationClose(options)
    })
  }
}

module.exports = html5NotificationUtil
