/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const messages = require('../constants/messages')
const SortableTable = require('../../app/renderer/components/common/sortableTable')
const ClipboardButton = require('../../app/renderer/components/common/clipboardButton')
const aboutActions = require('./aboutActions')

const ipc = window.chrome.ipcRenderer

const cx = require('../lib/classSet')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../app/renderer/components/styles/global')
const commonStyles = require('../../app/renderer/components/styles/commonStyles')

const {
  SectionTitleWrapper,
  AboutPageSectionTitle,
  AboutPageSectionSubTitle
} = require('../../app/renderer/components/common/sectionTitle')

require('../../less/about/common.less')
require('../../less/about/itemList.less')
require('../../less/about/siteDetails.less')

require('../../node_modules/font-awesome/css/font-awesome.css')

const tranformVersionInfoToString = (versionInformation) =>
  versionInformation
    .reduce((coll, version, name) => `${coll} \n${name}: ${version}`, '')

class AboutBrave extends React.Component {
  constructor (props) {
    super(props)
    this.state = { versionInformation: new Immutable.Map() }
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
    return <div className={cx({
      [css(styles.aboutPage)]: true,
      siteDetailsPage: true
    })}>
      <div className={cx({
        [css(styles.aboutPage__header)]: true,
        siteDetailsPageHeader: true
      })}>
        <SectionTitleWrapper>
          <AboutPageSectionTitle data-l10n-id='aboutBrave' />
        </SectionTitleWrapper>
        <div data-l10n-id='braveInfo' />
      </div>

      <div className='siteDetailsPageContent'>
        <AboutPageSectionSubTitle data-l10n-id='releaseNotes' />

        <div>
          <span data-l10n-id='relNotesInfo1' />
          &nbsp;
          <a className={css(commonStyles.linkText)}
            href={`https://github.com/brave/browser-laptop/releases/tag/v${this.state.versionInformation.get('Brave')}dev`}
            data-l10n-id='relNotesInfo2'
            rel='noopener' target='_blank'
          />
          &nbsp;
          <span data-l10n-id='relNotesInfo3' />
        </div>

        <div className={css(styles.aboutPage__versionInformation)}>
          <AboutPageSectionSubTitle data-l10n-id='versionInformation' />
          <ClipboardButton copyAction={this.onCopy} />
        </div>

        <SortableTable
          fillAvailable
          headings={['Name', 'Version']}
          rows={this.state.versionInformation.map((version, name) => [
            {
              html: name,
              value: name
            },
            {
              html: name === 'rev'
                ? <a className={css(commonStyles.linkText)} href={`https://github.com/brave/browser-laptop/commit/${version}`} rel='noopener' target='_blank'>{(version && version.substring(0, 7)) || ''}</a>
                : version,
              value: version
            }
          ])}
        />
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  aboutPage: {
    width: '400px',
    margin: globalStyles.spacing.aboutPageMargin,

    // Issue #10711
    // TODO: Refactor siteDetails.less to remove !important
    paddingTop: '0 !important'
  },

  aboutPage__header: {
    // TODO: Refactor siteDetails.less to remove !important
    padding: '0 !important'
  },

  aboutPage__versionInformation: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline'
  }
})

module.exports = <AboutBrave />
