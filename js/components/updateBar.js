/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')

const Button = require('./button')
const appActions = require('../actions/appActions')
const windowActions = require('../actions/windowActions')
const UpdateStatus = require('../constants/updateStatus')
const remote = global.require('electron').remote
const path = require('path')
const cx = require('../lib/classSet.js')

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
    return <span className='greeting'>
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
    return <Button className='button secondary'
      l10nId='updateHide'
      onClick={appActions.setUpdateStatus.bind(null, this.props.reset ? UpdateStatus.UPDATE_NONE : undefined, false, undefined)} />
  }
}

class UpdateLog extends ImmutableComponent {
  onViewLog () {
    remote.shell.openItem(path.join(remote.app.getPath('userData'), 'updateLog.log'))
  }
  render () {
    return <Button className='button updateViewLogButton secondary'
      l10nId='updateViewLog'
      onClick={this.onViewLog.bind(this)} />
  }
}

class UpdateAvailable extends ImmutableComponent {
  render () {
    return <div>
      <UpdateHello updateStatus={this.props.updateStatus} l10nId='updateHello' />
      <span className='message' data-l10n-id='updateAvail' />
      <span className='message secondary' data-l10n-id='updateRequiresRelaunch' />
      <span className='spacer' />
      <span className='options'>
        {
          this.props.metadata && this.props.metadata.get('notes')
          ? <Button className='button updateDetails secondary'
            l10nId='updateDetails'
            onClick={windowActions.setReleaseNotesVisible.bind(null, true)} />
          : null
        }
        <Button className='button updateLaterButton secondary'
          l10nId='updateLater'
          onClick={appActions.setUpdateStatus.bind(null, UpdateStatus.UPDATE_AVAILABLE_DEFERRED, false, undefined)} />
        <Button className='button primary'
          l10nId='updateNow'
          onClick={appActions.setUpdateStatus.bind(null, UpdateStatus.UPDATE_APPLYING_RESTART, false, undefined)} />
      </span>
    </div>
  }
}

class UpdateChecking extends ImmutableComponent {
  render () {
    return <div>
      <UpdateHello updateStatus={this.props.updateStatus} />
      <span className='message' data-l10n-id='updateChecking' />
      <span className='spacer' />
      <span className='options'>
        <UpdateLog />
        <UpdateHide />
      </span>
    </div>
  }
}

class UpdateDownloading extends ImmutableComponent {
  render () {
    return <div>
      <UpdateHello updateStatus={this.props.updateStatus} />
      <span className='message' data-l10n-id='updateDownloading' />
      <span className='spacer' />
      <span className='options'>
        <UpdateLog />
        <UpdateHide />
      </span>
    </div>
  }
}

class UpdateError extends ImmutableComponent {
  render () {
    return <div>
      <UpdateHello updateStatus={this.props.updateStatus} l10nId='updateOops' />
      <span className='message' data-l10n-id='updateError' />
      <span className='spacer' />
      <span className='options'>
        <UpdateLog />
        <UpdateHide reset />
      </span>
    </div>
  }
}

class UpdateNotAvailable extends ImmutableComponent {
  render () {
    return <div>
      <UpdateHello updateStatus={this.props.updateStatus} l10nId='updateNotYet' />
      <span className='message' data-l10n-id='updateNotAvail' />
      <span className='spacer' />
      <span className='options'>
        <UpdateHide reset />
      </span>
    </div>
  }
}

class UpdateBar extends ImmutableComponent {
  render () {
    if (!this.props.updates) {
      return null
    }

    // When verbose is not set we only want to show update available
    // prompts, because otherwise the check is a background check and
    // the user shouldn't be bothered.
    const verbose = this.props.updates.get('verbose')
    let updateStatus = this.props.updates.get('status')
    if (!updateStatus ||
        !verbose && updateStatus !== UpdateStatus.UPDATE_AVAILABLE ||
        updateStatus === UpdateStatus.UPDATE_NONE ||
        updateStatus === UpdateStatus.UPDATE_APPLYING_RESTART ||
        updateStatus === UpdateStatus.UPDATE_APPLYING_NO_RESTART) {
      return null
    }

    // The only difference between the deferred and non deferred variant is that
    // the deferred allows hiding.  Otherwise you couldn't hide available prompts.
    if (updateStatus === UpdateStatus.UPDATE_AVAILABLE_DEFERRED) {
      updateStatus = UpdateStatus.UPDATE_AVAILABLE
    }

    return <div className='updateBar'>
      {
        updateStatus === UpdateStatus.UPDATE_AVAILABLE ? <UpdateAvailable metadata={this.props.updates.get('metadata')} updateStatus={updateStatus} /> : null
      }
      {
        updateStatus === UpdateStatus.UPDATE_CHECKING ? <UpdateChecking updateStatus={updateStatus} /> : null
      }
      {
        updateStatus === UpdateStatus.UPDATE_DOWNLOADING ? <UpdateDownloading updateStatus={updateStatus} /> : null
      }
      {
        updateStatus === UpdateStatus.UPDATE_NOT_AVAILABLE ? <UpdateNotAvailable updateStatus={updateStatus} /> : null
      }
      {
        updateStatus === UpdateStatus.UPDATE_ERROR ? <UpdateError updateStatus={updateStatus} /> : null
      }
    </div>
  }
}

module.exports = UpdateBar
