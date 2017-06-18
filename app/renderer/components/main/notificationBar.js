/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../immutableComponent')
const NotificationItem = require('./notificationItem')

// Utils
const {getOrigin} = require('../../../../js/state/siteUtil')

// Styles
const commonStyles = require('../styles/commonStyles')
const globalStyles = require('../styles/global')

class NotificationBar extends ImmutableComponent {
  render () {
    const activeOrigin = getOrigin(this.props.activeFrame.get('location'))
    if (!activeOrigin) {
      return null
    }
    const activeNotifications = this.props.notifications.filter((item) =>
      item.get('frameOrigin') ? activeOrigin === item.get('frameOrigin') : true)

    if (!activeNotifications.size) {
      return null
    }

    return <div className={css(commonStyles.notificationBar)} data-test-id='notificationBar'>
      {
        activeNotifications.takeLast(3).map((notificationDetail) =>
          <NotificationItem detail={notificationDetail} />
        )
      }
    </div>
  }
}

class NotificationBarCaret extends ImmutableComponent {
  render () {
    return <div className={css(styles.caretWrapper)}>
      <div className={css(styles.caretWrapper__caret)} />
    </div>
  }
}

const styles = StyleSheet.create({
  caretWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: globalStyles.zindex.zindexTabs,
    filter: 'drop-shadow(rgba(0,0,0,0.25) 0px 0px 1px)'
  },

  caretWrapper__caret: {
    position: 'relative',
    margin: 'auto',
    width: '16px',

    ':before': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      borderBottom: `6px solid ${globalStyles.color.notificationItemColor}`,
      borderLeft: '8px solid transparent',
      borderRight: '8px solid transparent'
    }
  }
})

module.exports = {
  NotificationBar,
  NotificationBarCaret
}
