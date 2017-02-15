/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../components/immutableComponent')
const {aboutUrls} = require('../../lib/appUrlUtil')

class FooterInfo extends ImmutableComponent {
  render () {
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
        <a className='shortcutIcon settingsIcon' href={aboutUrls.get('about:preferences')} data-l10n-id='preferencesPage' />
        <a className='shortcutIcon bookmarksIcon' href={aboutUrls.get('about:bookmarks')} data-l10n-id='bookmarksPage' />
        <a className='shortcutIcon historyIcon' href={aboutUrls.get('about:history')} data-l10n-id='historyPage' />
      </nav>
    </footer>
  }
}

module.exports = FooterInfo
