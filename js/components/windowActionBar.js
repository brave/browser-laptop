/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const os = require('os')
const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const currentWindow = require('../../app/renderer/currentWindow')

class WindowActionBar extends ImmutableComponent {
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
      case 'linux':
        return 'linux'
      case 'win32':
        if (/10.0./.test(os.release())) {
          return 'win-10'
        } else if (/6.1./.test(os.release())) {
          return 'win-7'
        } else {
          return 'win'
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
    return <div className='window-header'>
      <div className={this.osClass + ' title-bar-btns'}>
        <button className={this.buttonClass + ' win-action-btn min-btn'} onClick={this.onMinimizeClick}></button>
        <button className={this.buttonClass + ' win-action-btn max-btn'} onClick={this.onMaximizeClick}></button>
        <button className={this.buttonClass + ' win-action-btn close-btn'} onClick={this.onCloseClick}></button>
      </div>
    </div>
  }
}

module.exports = WindowActionBar
