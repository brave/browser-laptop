/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const os = require('os')
const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const locale = require('../../../js/l10n')
const currentWindow = require('../currentWindow')

class WindowCaptionButtons extends ImmutableComponent {
  constructor () {
    super()
    this.onDoubleClick = this.onDoubleClick.bind(this)
    this.onMinimizeClick = this.onMinimizeClick.bind(this)
    this.onMaximizeClick = this.onMaximizeClick.bind(this)
    this.onCloseClick = this.onCloseClick.bind(this)
    this.osClass = this.getPlatformCssClass()
  }

  get buttonClass () {
    return (this.props.windowMaximized ? 'fullscreen' : '')
  }

  getPlatformCssClass () {
    switch (os.platform()) {
      case 'win32':
        if (/6.1./.test(os.release())) {
          return 'win7'
        } else {
          return 'win10'
        }
      default:
        return 'hidden'
    }
  }

  onMinimizeClick (e) {
    currentWindow.minimize()
  }

  onMaximizeClick (e) {
    return (!currentWindow.isMaximized()) ? currentWindow.maximize() : currentWindow.unmaximize()
  }

  onCloseClick (e) {
    currentWindow.close()
  }

  onDoubleClick (e) {
    if (!e.target.className.includes('navigatorWrapper')) {
      return
    }
    this.onMaximizeClick(e)
  }

  render () {
    return <div className={this.buttonClass + ' windowCaptionButtons'}>
      <div className={'container ' + this.osClass}>
        <button
          className={this.buttonClass + ' captionButton minimize'}
          onClick={this.onMinimizeClick}
          title={locale.translation('windowCaptionButtonMinimize')}>
          <div className='widget' />
        </button>
        <button
          className={this.buttonClass + ' captionButton maximize'}
          onClick={this.onMaximizeClick}
          title={locale.translation(this.props.windowMaximized ? 'windowCaptionButtonRestore' : 'windowCaptionButtonMaximize')}>
          <div className='widget'><div className='widget1' /><div className='widget2' /><div className='widget3' /><div className='widget4' /><div className='widget5' /></div>
        </button>
        <button
          className={this.buttonClass + ' captionButton close'}
          onClick={this.onCloseClick}
          title={locale.translation('windowCaptionButtonClose')}>
          <div className='widget'><div className='widget1' /><div className='widget2' /><div className='widget3' /></div>
        </button>
      </div>
    </div>
  }
}

module.exports = WindowCaptionButtons
