/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const messages = require('../constants/messages')
const aboutActions = require('./aboutActions')

const ipc = window.chrome.ipcRenderer

require('../../less/about/flash.less')

const isDarwin = window.navigator.platform === 'MacIntel'

class FlashPlaceholder extends ImmutableComponent {
  // TODO: Show placeholder telling user how to enable flash if it's not
  constructor () {
    super()
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onPrefsClick = this.onPrefsClick.bind(this)
    this.state = {
      flashEnabled: this.flashEnabled
    }
    ipc.on(messages.BRAVERY_DEFAULTS_UPDATED, (e, braveryDefaults) => {
      this.setState({
        flashEnabled: braveryDefaults && braveryDefaults.flash && braveryDefaults.flash.enabled
      })
    })
  }

  get origin () {
    // XXX: This is not necessarily the source of the flash, since the
    // untrusted page can change the URL fragment. However, the user is
    // aware what source they are approving for.
    let parts = window.location.href.split('#')
    if (parts && parts[1]) {
      return parts[1]
    } else {
      return null
    }
  }

  get flashEnabled () {
    // messages.BRAVERY_DEFAULTS_UPDATED is not received if this is loaded in an
    // iframe, which it usually is. as a workaround, get the flash enabled
    // state from the parent via an anchor string.
    let parts = window.location.href.split('#')
    if (parts && parts[2]) {
      return parts[2] === 'flashEnabled'
    } else {
      return false
    }
  }

  onContextMenu (e) {
    if (!this.state.flashEnabled) {
      e.preventDefault()
    }
  }

  onPrefsClick (e) {
    aboutActions.newFrame({
      location: 'about:preferences#security'
    }, true)
  }

  render () {
    const flashEnabled = this.state.flashEnabled
    // TODO: Localization doesn't work due to CORS error from inside iframe
    const cmd = isDarwin ? 'Control-Click' : 'Right-Click'
    const flashRightClick = flashEnabled ? `${cmd} to run Adobe Flash Player` : 'Adobe Flash has been blocked.'
    const flashSubtext = `on ${this.origin || 'this site'}.`
    return <div onContextMenu={this.onContextMenu}>
      <div className='flashMainContent'>
        <img src='img/bravePluginAlert.png' />
        <div id='flashRightClick'>{flashRightClick}</div>
        <div className='flashSubtext'>
          {
            flashEnabled
            ? flashSubtext
            : <span>
              To run Flash, enable it in <span className='linkText' onClick={this.onPrefsClick}>Preferences</span>.
            </span>
          }
        </div>
      </div>
      {
        flashEnabled
        ? <div className='flashFooter'>
          For security, <span className='linkText' onClick={this.onPrefsClick}>approvals</span> expire in 1 week.
        </div>
        : null
      }
    </div>
  }
}

module.exports = <FlashPlaceholder />
