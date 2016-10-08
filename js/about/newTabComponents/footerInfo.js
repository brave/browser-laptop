/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

class FooterInfo extends React.Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    return <footer className='footerContainer'>
      <div className='copyrightNotice'>
        <div className='copyrightCredits'>
          <span className='photoBy' data-l10n-id='photoBy' /> <a className='copyrightOwner' href={this.props.photographerLink} target='_blank'>{this.props.photographer}</a>
        </div>
        <span className='photoName'>{this.props.photoName}</span>
      </div>
      <nav className='shortcutsContainer'>
        <a className='shortcutIcon settingsIcon' href={this.props.settingsPage} data-l10n-id='preferencesPage' />
        <a className='shortcutIcon bookmarksIcon' href={this.props.bookmarksPage} data-l10n-id='bookmarksPage' />
        <a className='shortcutIcon historyIcon' href={this.props.historyPage} data-l10n-id='historyPage' />
      </nav>
    </footer>
  }
}
module.exports = FooterInfo
