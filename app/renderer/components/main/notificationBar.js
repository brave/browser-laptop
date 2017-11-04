/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const NotificationItem = require('./notificationItem')

// Utils
const {getOrigin} = require('../../../../js/state/siteUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const notificationBarState = require('../../../common/state/notificationBarState')

// Styles
const commonStyles = require('../styles/commonStyles')
const globalStyles = require('../styles/global')

class NotificationBar extends React.Component {
  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeOrigin = getOrigin(activeFrame.get('location'))
    const notifications = notificationBarState.getNotifications(state)

    const props = {}
    props.activeNotifications = notifications
      .filter((item) => {
        return item.get('frameOrigin')
          ? activeOrigin === item.get('frameOrigin')
          // TODO: this should filter all cases
          // for notifications that are not per-tab
          // and not only ledger
          : item.get('from') !== 'ledger'
      })
      .takeLast(3)
    props.showNotifications = !props.activeNotifications.isEmpty()
    return props
  }

  render () {
    // Avoid rendering an empty notification wrapper
    if (!this.props.showNotifications) {
      return null
    }
    return <div className={css(commonStyles.notificationBar)} data-test-id='notificationBar'>
      {
        this.props.activeNotifications.map((notification) =>
          <NotificationItem message={notification.get('message')} />
        )
      }
    </div>
  }
}

// TODO maybe this should be merged in <NotificationBar /> and defined
// per conditional prop such as isGlobal={conditional}
class BraveNotificationBar extends React.Component {
  mergeProps (state, ownProps) {
    const props = {}
    // TODO: for now we cover only ledger notifications in this method
    // this should cover all notifications that are global
    props.notifications = notificationBarState.getLedgerNotifications(state)
    props.showNotifications = !props.notifications.isEmpty()
    return props
  }

  render () {
    // Avoid rendering an empty notification wrapper
    if (!this.props.showNotifications) {
      return null
    }
    return (
      <div className={css(commonStyles.notificationBar)} data-test-id='braveNotificationBar'>
        {
          this.props.notifications.map((notification) =>
            <NotificationItem message={notification.get('message')} />
          )
        }
      </div>
    )
  }
}

class NotificationBarCaret extends React.Component {
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
  NotificationBar: ReduxComponent.connect(NotificationBar),
  BraveNotificationBar: ReduxComponent.connect(BraveNotificationBar),
  NotificationBarCaret
}
