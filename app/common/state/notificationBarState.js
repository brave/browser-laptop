/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const { createSelector } = require('reselect')
const frameStateUtil = require('../../../js/state/frameStateUtil')
const { getOrigin } = require('../../../js/lib/urlutil')
const { generateWindowStateSelector } = require('./windowState')

// the portion of the appStore state that concerns notifications
const selectNotificationState = state => state.get('notifications', Immutable.List())

const notificationBarState = {
  /**
   * Gets an immutable list of notifications
   * @param {Map} appState - The app state object
   * @return {List} - immutable list of notifications
   */
  getNotifications: selectNotificationState,

  /**
   * Gets an immutable list of global notifications (shown above tab bar)
   * @param {Map} appState - The app state object
   * @return {List} - immutable list of global notifications
   */
  getGlobalNotifications: createSelector(
    selectNotificationState,
    notifications => notifications.filter(item => item.get('position') === 'global')
  ),

  /**
   * Get notifications which should be considered 'active',
   * that is - notifications for the active frame origin,
   * and all other notifications that are not from the ledger.
   * Limited to the last 3 notifications.
   */
  getActiveNotifications: createSelector(
    // select active frame origin
    // since the active frame data changes extremely frequently,
    // but the origin does not, do not perform the notifications
    // filter on every change of every frame property, just the origin
    createSelector(
      // generateWindowStateSelector is required
      // to convert to state.currentWindow since some selectors require appState
      // and some require windowState
      generateWindowStateSelector(
        frameStateUtil.getActiveFrame
      ),
      // will only be re-computed if the active frame state changes (frequently)
      activeFrame => getOrigin((activeFrame || Immutable.Map()).get('location'))
    ),
    // select all notifications
    selectNotificationState,
    // if either active frame origin, or all notifications change,
    // then reevaluate what 'active notifications' are
    (activeFrameOrigin, notifications) => {
      console.log('re-eval active notifications')
      return notifications
        .filter((item) => {
          const notificationFrameOrigin = item.get('frameOrigin')
          return notificationFrameOrigin
            ? activeFrameOrigin === notificationFrameOrigin
            // filter to non-global notifications
            // i.e. frame-only
            : item.get('position') !== 'global'
        })
        .takeLast(3)
    }
  )

}

module.exports = notificationBarState
