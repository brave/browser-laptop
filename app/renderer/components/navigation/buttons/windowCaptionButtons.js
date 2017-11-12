/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../../immutableComponent')

// Actions
const appActions = require('../../../../../js/actions/appActions')
const windowActions = require('../../../../../js/actions/windowActions')

// Utils
const locale = require('../../../../../js/l10n')
const {getCurrentWindowId} = require('../../../currentWindow')
const cx = require('../../../../../js/lib/classSet')

class WindowCaptionButtons extends ImmutableComponent {
  constructor () {
    super()
    this.onDoubleClick = this.onDoubleClick.bind(this)
    this.onMinimizeClick = this.onMinimizeClick.bind(this)
    this.onMaximizeClick = this.onMaximizeClick.bind(this)
    this.onCloseClick = this.onCloseClick.bind(this)
  }

  get maximizeTitle () {
    return this.props.windowMaximizedFullScreen
      ? 'windowCaptionButtonRestore'
      : 'windowCaptionButtonMaximize'
  }

  onMinimizeClick () {
    windowActions.shouldMinimize(getCurrentWindowId())
  }

  onMaximizeClick () {
    const currentWindowId = getCurrentWindowId()
    if (this.props.windowFullScreen) {
      // If full screen, toggle full screen status and restore window (make smaller)
      windowActions.shouldExitFullScreen(currentWindowId)
      if (this.props.windowMaximized) windowActions.shouldUnmaximize(currentWindowId)
      return false
    }
    return (!this.props.windowMaximized) ? windowActions.shouldMaximize(currentWindowId) : windowActions.shouldUnmaximize(currentWindowId)
  }

  onCloseClick () {
    appActions.closeWindow(getCurrentWindowId())
  }

  onDoubleClick (e) {
    if (!e.target.className.includes('navigatorWrapper')) {
      return
    }
    this.onMaximizeClick(e)
  }

  render () {
    const props = { tabIndex: -1 }

    return <div className={cx({
      fullscreen: this.props.windowMaximizedFullScreen,
      windowCaptionButtons: true,
      verticallyCenter: this.props.verticallyCenter
    })}>
      <div className='container'>
        <button
          {...props}
          className={cx({
            normalizeButton: true,
            fullscreen: this.props.windowMaximizedFullScreen,
            captionButton: true,
            minimize: true
          })}
          onClick={this.onMinimizeClick}
          data-test-id='minimizeButton'
          aria-label={locale.translation('windowCaptionButtonMinimize')}>
          <div className='widget' />
        </button>
        <button
          {...props}
          className={cx({
            normalizeButton: true,
            fullscreen: this.props.windowMaximizedFullScreen,
            captionButton: true,
            maximize: true
          })}
          onClick={this.onMaximizeClick}
          data-test-id='maximizeButton'
          aria-label={locale.translation(this.maximizeTitle)}>
          <div className='widget'>
            <div className='widget1' />
            <div className='widget2' />
            <div className='widget3' />
          </div>
        </button>
        <button
          {...props}
          className={cx({
            normalizeButton: true,
            fullscreen: this.props.windowMaximizedFullScreen,
            captionButton: true,
            close: true
          })}
          onClick={this.onCloseClick}
          data-test-id='closeButton'
          aria-label={locale.translation('windowCaptionButtonClose')}>
          <div className='widget' />
        </button>
      </div>
    </div>
  }
}

module.exports = WindowCaptionButtons
