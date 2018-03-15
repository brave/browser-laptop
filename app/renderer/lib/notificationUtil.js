/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 /* global Notification */

const immutableUtil = require('../../common/state/immutableUtil')
const appActions = require('../../../js/actions/appActions')

const util = {
  createNotification: (title, options, timeout = 5000) => {
    if (!title) {
      console.log('Title is not provided for the notification')
      return
    }

    options = immutableUtil.makeJS(options)

    const notification = new Notification(title, options)
    if (timeout) {
      setTimeout(notification.close.bind(notification), timeout)
    }

    notification.addEventListener('click', (e) => {
      const data = e.currentTarget.data
      appActions.onNativeNotificationClick(data)
    })

    notification.addEventListener('error', (e) => {
      const data = e.currentTarget.data
      console.log('notification error', data)
    })
  }
}

module.exports = util
