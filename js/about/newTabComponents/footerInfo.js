/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../app/renderer/components/immutableComponent')
const aboutActions = require('../aboutActions')
const BraveLink = require('../../../app/renderer/components/common/braveLink')

const {StyleSheet} = require('aphrodite/no-important')

class FooterInfo extends ImmutableComponent {
  render () {
    const openUrl = (url) => aboutActions.createTabRequested.bind(null, {url})
    return <footer className='footerContainer'>
      <div className='copyrightNotice'>
        {
          this.props.backgroundImage && this.props.backgroundImage.name
          ? <div>
            <div className='copyrightCredits'>
              <span className='photoBy' data-l10n-id='photoBy' /> <BraveLink href={this.props.backgroundImage.link} customStyle={styles.copyrightCredits__owner}>{this.props.backgroundImage.author}</BraveLink>
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

const styles = StyleSheet.create({
  copyrightCredits__owner: {
    color: '#fff',
    textTransform: 'uppercase',
    textDecoration: 'underline'
  }
})

module.exports = FooterInfo
