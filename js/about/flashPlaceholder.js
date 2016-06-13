/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const messages = require('../constants/messages')

require('../../less/about/flash.less')

const isDarwin = window.navigator.platform === 'MacIntel'

class FlashPlaceholder extends ImmutableComponent {
  // TODO: Show placeholder telling user how to enable flash if it's not
  constructor () {
    super()
    this.state = {
      flashEnabled: null
    }
    window.addEventListener(messages.BRAVERY_DEFAULTS_UPDATED, (e) => {
      this.setState({
        flashEnabled: e.detail && e.detail.flash && e.detail.flash.enabled
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

  render () {
    // TODO: Localization doesn't work due to CORS error from inside iframe
    const cmd = isDarwin ? 'Control-Click' : 'Right-Click'
    const flashRightClick = `${cmd} to run Adobe Flash Player`
    const flashExpirationText = 'Approvals expire 7 days after last site visit.'
    const flashSubtext = `on ${this.origin || 'this site'}.`
    return <div>
      <div className='flashMainContent'>
        <img src='img/bravePluginAlert.png' />
        <div id='flashRightClick'>{flashRightClick}</div>
        <div className='flashSubtext'>{flashSubtext}</div>
      </div>
      <div className='flashFooter'>
        {flashExpirationText}
      </div>
    </div>
  }
}

module.exports = <FlashPlaceholder />
