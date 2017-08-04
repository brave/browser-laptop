/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../immutableComponent')
const ReduxComponent = require('../reduxComponent')
const {BrowserButton} = require('../common/browserButton')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Constants
const UpdateStatus = require('../../../../js/constants/updateStatus')

// State
const updateState = require('../../../common/state/updateState')

// Utils
const cx = require('../../../../js/lib/classSet')

// Styles
const commonStyles = require('../styles/commonStyles')

class UpdateHello extends ImmutableComponent {
  onSpinnerClick () {
    // To make testing of updates easier in dev mode,
    // clicking on the spinner toggles the UI
    if (process.env.NODE_ENV === 'development') {
      let nextStatus = UpdateStatus.UPDATE_NONE
      switch (this.props.updateStatus) {
        case UpdateStatus.UPDATE_CHECKING:
          nextStatus = UpdateStatus.UPDATE_DOWNLOADING
          break
        case UpdateStatus.UPDATE_DOWNLOADING:
          nextStatus = UpdateStatus.UPDATE_NOT_AVAILABLE
          break
        case UpdateStatus.UPDATE_NOT_AVAILABLE:
          nextStatus = UpdateStatus.UPDATE_AVAILABLE
          break
        case UpdateStatus.UPDATE_AVAILABLE:
          nextStatus = UpdateStatus.UPDATE_ERROR
          break
        case UpdateStatus.UPDATE_ERROR:
          break
      }
      appActions.setUpdateStatus(nextStatus)
    }
  }

  get loading () {
    return this.props.updateStatus === UpdateStatus.UPDATE_CHECKING ||
      this.props.updateStatus === UpdateStatus.UPDATE_DOWNLOADING
  }

  render () {
    return <span className={css(commonStyles.notificationItem__greeting)} data-test-id='greeting'>
      <span onClick={this.onSpinnerClick.bind(this)}
        className={cx({
          fa: this.loading,
          'fa-spinner': this.loading,
          'fa-spin': this.loading
        })}
        data-l10n-id={this.props.l10nId} />
    </span>
  }
}

class UpdateHide extends ImmutableComponent {
  render () {
    return <BrowserButton groupedItem notificationItem secondaryColor
      testId='updateHide'
      l10nId='updateHide'
      onClick={appActions.setUpdateStatus.bind(null, this.props.reset ? UpdateStatus.UPDATE_NONE : undefined, false, undefined)} />
  }
}

class UpdateLog extends ImmutableComponent {
  onViewLog () {
    appActions.updateLogOpened()
  }

  render () {
    return <BrowserButton groupedItem notificationItem secondaryColor
      testId='updateViewLogButton'
      l10nId='updateViewLog'
      onClick={this.onViewLog.bind(this)} />
  }
}

class UpdateAvailable extends ImmutableComponent {
  render () {
    return <div className={css(styles.flexJustifyBetween, styles.flexAlignCenter)}>
      <div>
        <UpdateHello updateStatus={this.props.updateStatus} l10nId='updateHello' />
        <span className={css(commonStyles.notificationItem__message)} data-l10n-id='updateAvail' />
        <span className={css(commonStyles.notificationItem__secondaryMessage)} data-l10n-id='updateRequiresRelaunch' />
      </div>
      <span className={css(styles.flexAlignCenter)} data-test-id='notificationOptions'>
        {
          this.props.notes
          ? <BrowserButton groupedItem notificationItem secondaryColor
            testId='updateDetails'
            l10nId='updateDetails'
            onClick={windowActions.setReleaseNotesVisible.bind(null, true)} />
          : null
        }
        <BrowserButton groupedItem notificationItem secondaryColor
          testId='updateLater'
          l10nId='updateLater'
          onClick={appActions.setUpdateStatus.bind(null, UpdateStatus.UPDATE_AVAILABLE_DEFERRED, false, undefined)} />
        <BrowserButton groupedItem notificationItem primaryColor
          testId='updateNow'
          l10nId='updateNow'
          onClick={appActions.setUpdateStatus.bind(null, UpdateStatus.UPDATE_APPLYING_RESTART, false, undefined)} />
      </span>
    </div>
  }
}

class UpdateChecking extends ImmutableComponent {
  render () {
    return <div className={css(styles.flexJustifyBetween)}>
      <div>
        <UpdateHello updateStatus={this.props.updateStatus} />
        <span className={css(commonStyles.notificationItem__message)} data-l10n-id='updateChecking' />
      </div>
      <span className={css(styles.flexAlignCenter)} data-test-id='notificationOptions'>
        <UpdateLog />
        <UpdateHide />
      </span>
    </div>
  }
}

class UpdateDownloading extends ImmutableComponent {
  render () {
    return <div className={css(styles.flexJustifyBetween)}>
      <div>
        <UpdateHello updateStatus={this.props.updateStatus} />
        <span className={css(commonStyles.notificationItem__message)} data-l10n-id='updateDownloading' />
      </div>
      <span className={css(styles.flexAlignCenter)} data-test-id='notificationOptions'>
        <UpdateLog />
        <UpdateHide />
      </span>
    </div>
  }
}

class UpdateError extends ImmutableComponent {
  render () {
    return <div className={css(styles.flexJustifyBetween)}>
      <div>
        <UpdateHello updateStatus={this.props.updateStatus} l10nId='updateOops' />
        <span className={css(commonStyles.notificationItem__message)} data-l10n-id='updateError' />
      </div>
      <span className={css(styles.flexAlignCenter)} data-test-id='notificationOptions'>
        <UpdateLog />
        <UpdateHide reset />
      </span>
    </div>
  }
}

class UpdateNotAvailable extends ImmutableComponent {
  render () {
    return <div className={css(styles.flexJustifyBetween)}>
      <div>
        <UpdateHello updateStatus={this.props.updateStatus} l10nId='updateNotYet' />
        <span className={css(commonStyles.notificationItem__message)} data-l10n-id='updateNotAvail' />
      </div>
      <span className={css(styles.flexAlignCenter)} data-test-id='notificationOptions'>
        <UpdateHide reset />
      </span>
    </div>
  }
}

class UpdateBar extends React.Component {
  mergeProps (state, ownProps) {
    const props = {}
    props.updateStatus = updateState.getUpdateStatus(state)
    props.notes = state.getIn(['updates', 'metadata', 'notes'])
    props.isAvailable = props.updateStatus === UpdateStatus.UPDATE_AVAILABLE
    props.isChecking = props.updateStatus === UpdateStatus.UPDATE_CHECKING
    props.isDownloading = props.updateStatus === UpdateStatus.UPDATE_DOWNLOADING
    props.isNotAvailable = props.updateStatus === UpdateStatus.UPDATE_NOT_AVAILABLE
    props.isError = props.updateStatus === UpdateStatus.UPDATE_ERROR

    return props
  }

  render () {
    // 'notificationItem' for styling with notificationBar.less
    return <div className={cx({
      [updateBarStyle]: true,
      notificationItem: true
    })} data-test-id='updateBar'>
      {
        this.props.isAvailable
          ? <UpdateAvailable notes={this.props.notes} updateStatus={this.props.updateStatus} />
          : null
      }
      {
        this.props.isChecking
          ? <UpdateChecking updateStatus={this.props.updateStatus} />
          : null
      }
      {
        this.props.isDownloading
          ? <UpdateDownloading updateStatus={this.props.updateStatus} />
          : null
      }
      {

        this.props.isNotAvailable
          ? <UpdateNotAvailable updateStatus={this.props.updateStatus} />
          : null
      }
      {
        this.props.isError
          ? <UpdateError updateStatus={this.props.updateStatus} />
          : null
      }
    </div>
  }
}

module.exports = ReduxComponent.connect(UpdateBar)

const styles = StyleSheet.create({
  flexJustifyBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    flexFlow: 'row wrap'
  },
  flexAlignCenter: {
    display: 'flex',
    alignItems: 'center'
  }
})

const updateBarStyle = css(
  commonStyles.notificationBar,
  commonStyles.notificationBar__notificationItem,
  commonStyles.notificationBar__greetingStyle
)
