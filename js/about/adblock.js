/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const Immutable = require('immutable')
const messages = require('../constants/messages')

const ipc = window.chrome.ipc

// Stylesheets
require('../../less/about/itemList.less')
require('../../less/about/adblock.less')

class AboutAdBlock extends React.Component {
  constructor () {
    super()
    this.state = {
      adblock: Immutable.Map()
    }
    ipc.on(messages.ADBLOCK_UPDATED, (e, detail) => {
      if (!detail) {
        return
      }
      this.setState({
        adblock: Immutable.fromJS(detail.adblock)
      })
    })
  }
  render () {
    const lastUpdateDate = new Date(this.state.adblock.get('lastCheckDate'))
    return <div className='adblockDetailsPage'>
      <h2 data-l10n-id='adblock' />
      <list>
        <div role='listitem'>
          <div className='adblockDetailsPageContent'>
            <div className='adblockCount'><span data-l10n-id='blockedCountLabel' /> <span className='blockedCountTotal'>{this.state.adblock.get('count') || 0}</span></div>
            {
              Number.isNaN(lastUpdateDate.getTime())
              ? null
              : <div className='adblockLastChecked'><span data-l10n-id='lastUpdateCheckDateLabel' /> <span>{lastUpdateDate.toLocaleDateString()}</span></div>
            }
            {
              this.state.adblock.get('etag')
              ? <div className='adblockLastETag'><span data-l10n-id='lastCheckETagLabel' /> <span>{this.state.adblock.get('etag')}</span></div>
              : null
            }
          </div>
        </div>
      </list>
    </div>
  }
}

module.exports = <AboutAdBlock />
