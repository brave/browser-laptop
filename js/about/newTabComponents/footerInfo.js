/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../components/immutableComponent')
const aboutActions = require('../aboutActions')

class FooterInfo extends ImmutableComponent {
  render () {
    const openUrl = (url) => aboutActions.createTabRequested.bind(null, {url})
    return <footer className='footerContainer'>
      <div className='copyrightNotice'>
        {
          this.props.backgroundImage && this.props.backgroundImage.name
          ? <div>
            <div className='copyrightCredits'>
              <span className='photoBy' data-l10n-id='photoBy' /> <a className='copyrightOwner' href={this.props.backgroundImage.link} target='_blank'>{this.props.backgroundImage.author}</a>
            </div>
            <span className='photoName'>{this.props.backgroundImage.name}</span>
          </div>
          : null
        }
      </div>
      <nav className='shortcutsContainer'>
        <span className='shortcutIcon settingsIcon' onClick={openUrl('about:preferences')} data-l10n-id='preferencesPage' />
        <span className='shortcutIcon bookmarksIcon' onClick={openUrl('about:bookmarks')} data-l10n-id='bookmarksPage' />
        <span className='shortcutIcon historyIcon' onClick={openUrl('about:history')} data-l10n-id='historyPage' />
      </nav>
    </footer>
  }
}

module.exports = FooterInfo
