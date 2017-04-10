/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const messages = require('../constants/messages')
const SortableTable = require('../components/sortableTable')
const ClipboardButton = require('../../app/renderer/components/clipboardButton')
const aboutActions = require('./aboutActions')

const ipc = window.chrome.ipcRenderer

require('../../less/about/history.less')
require('../../less/about/brave.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

const tranformVersionInfoToString = (versionInformation) =>
  versionInformation
    .reduce((coll, entry) => `${coll} \n${entry.get('name')}: ${entry.get('version')}`, '')

class AboutBrave extends React.Component {
  constructor () {
    super()
    this.state = { versionInformation: Immutable.fromJS([]) }
    ipc.on(messages.VERSION_INFORMATION_UPDATED, (e, versionInformation) => {
      if (this.state.versionInformation.size === 0) {
        this.setState({versionInformation: Immutable.fromJS(versionInformation)})
      }
    })
    this.onCopy = this.onCopy.bind(this)
  }

  onCopy () {
    aboutActions.setClipboard(tranformVersionInfoToString(this.state.versionInformation))
  }

  render () {
    return <div className='siteDetailsPage'>
      <div className='siteDetailsPageHeader'>
        <div data-l10n-id='aboutBrave' className='sectionTitle' />
        <div data-l10n-id='braveInfo' className='title' />
      </div>

      <div className='siteDetailsPageContent aboutBrave'>
        <div>
          <div className='title'>
            <div data-l10n-id='releaseNotes' className='sectionTitle' />
          </div>

          <div className='title releaseNotes'>
            <span data-l10n-id='relNotesInfo1' />
            &nbsp;
            <a className='linkText' href={`https://github.com/brave/browser-laptop/releases/tag/v${this.state.versionInformation.getIn([0, 'version'])}dev`} target='_blank' data-l10n-id='relNotesInfo2' />
            &nbsp;
            <span data-l10n-id='relNotesInfo3' />
          </div>
        </div>

        <div className='title'>
          <span className='sectionTitle' data-l10n-id='versionInformation' />
          <ClipboardButton
            dataL10nId='copyToClipboard'
            className='fa fa-clipboard'
            copyAction={this.onCopy}
          />
        </div>

        <SortableTable
          headings={['Name', 'Version']}
          rows={this.state.versionInformation.map((entry) => [
            {
              html: entry.get('name'),
              value: entry.get('name')
            },
            {
              html: entry.get('name') === 'rev'
                ? <a target='_blank' href={`https://github.com/brave/browser-laptop/commit/${entry.get('version')}`}>{(entry.get('version') && entry.get('version').substring(0, 7)) || ''}</a>
                : entry.get('version'),
              value: entry.get('version')
            }
          ])}
        />
      </div>
    </div>
  }
}

module.exports = <AboutBrave />
