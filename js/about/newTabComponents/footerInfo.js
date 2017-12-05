/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../app/renderer/components/immutableComponent')
const aboutActions = require('../aboutActions')

const createOpenUrlBinding = (url) => aboutActions.createTabRequested.bind(null, {url})
const preferencesOpenUrlBinding = createOpenUrlBinding('about:preferences')
const bookmarksOpenUrlBinding = createOpenUrlBinding('about:bookmarks')
const historyOpenUrlBinding = createOpenUrlBinding('about:history')

class FooterInfo extends ImmutableComponent {
  render () {
    return <footer className='footerContainer'>
      <div className='copyrightNotice'>
        {
          this.props.backgroundImage && this.props.backgroundImage.name
          ? <div>
            <div className='copyrightCredits'>
              <span className='photoBy' data-l10n-id='photoBy' /> <a className='copyrightOwner' href={this.props.backgroundImage.link} rel='noopener' target='_blank'>{this.props.backgroundImage.author}</a>
            </div>
            <span className='photoName'>{this.props.backgroundImage.name}</span>
          </div>
          : null
        }
      </div>
      <nav className='shortcutsContainer'>
        <span className='shortcutIcon settingsIcon' onClick={preferencesOpenUrlBinding} data-l10n-id='preferencesPage' />
        <span className='shortcutIcon bookmarksIcon' onClick={bookmarksOpenUrlBinding} data-l10n-id='bookmarksPage' />
        <span className='shortcutIcon historyIcon' onClick={historyOpenUrlBinding} data-l10n-id='historyPage' />
      </nav>
    </footer>
  }
}

module.exports = FooterInfo
