/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const Immutable = require('immutable')
const messages = require('../constants/messages')
const {ADBLOCK_CUSTOM_RULES} = require('../constants/settings')
const getSetting = require('../settings').getSetting
const aboutActions = require('./aboutActions')
const ImmutableComponent = require('../../app/renderer/components/immutableComponent')
const SwitchControl = require('../components/switchControl')
const {DefaultTextArea} = require('../../app/renderer/components/textbox')

const {StyleSheet, css} = require('aphrodite/no-important')

const ipc = window.chrome.ipcRenderer

// Stylesheets
require('../../less/switchControls.less')
require('../../less/about/adblock.less')

class AdBlockItem extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
  }
  onClick (e) {
    aboutActions.updateAdblockDataFiles(this.props.resource.get('uuid'), e.target.value)
  }
  get prefKey () {
    return `adblock.${this.props.resource.get('uuid')}.enabled`
  }
  render () {
    return <div>
      <SwitchControl id={this.props.resource.get('uuid')}
        rightText={this.props.resource.get('title')}
        className={`switch-${this.props.resource.get('uuid')}`}
        disabled={this.props.disabled}
        onClick={this.onClick}
        checkedOn={getSetting(this.prefKey, this.props.settings)} />
    </div>
  }
}

class AboutAdBlock extends React.Component {
  constructor () {
    super()
    this.onChangeCustomFilters = this.onChangeCustomFilters.bind(this)
    this.state = {
      adblock: Immutable.Map(),
      resources: Immutable.List()
    }
    ipc.on(messages.ADBLOCK_UPDATED, (e, detail) => {
      if (!detail) {
        return
      }
      this.setState({
        adblock: Immutable.fromJS(detail.adblock),
        settings: Immutable.fromJS(detail.settings),
        resources: Immutable.fromJS(detail.resources || [])
      })
    })
  }
  render () {
    const lastUpdateDate = new Date(this.state.adblock.get('lastCheckDate'))
    return <div className={css(styles.adblockDetailsPage)}>
      <h2 className={css(styles.adblockDetailsPage__h2)} data-l10n-id='adblock' />
      <list>
        <div role='listitem'>
          <div className={css(styles.adblockDetailsPageContent)}>
            <div><span data-l10n-id='blockedCountLabel' /> <span data-test-id='blockedCountTotal'>{this.state.adblock.get('count') || 0}</span></div>
            {
              Number.isNaN(lastUpdateDate.getTime())
              ? null
              : <div><span data-l10n-id='lastUpdateCheckDateLabel' /> <span>{lastUpdateDate.toLocaleDateString()}</span></div>
            }
            {
              this.state.adblock.get('etag')
              ? <div><span data-l10n-id='lastCheckETagLabel' /> <span>{this.state.adblock.get('etag')}</span></div>
              : null
            }
            <h3 className={css(styles.adblockDetailsPage__h3)} data-l10n-id='additionalFilterLists' />
            <div className={css(styles.adblockSubtext)} data-l10n-id='adblockTooManyListsWarning' />
            <div className={css(styles.adblockLists)}>
              {
                this.state.resources.map((resource) =>
                  <AdBlockItem resource={resource}
                    settings={this.state.settings} />)
              }
            </div>
            <h3 className={css(styles.adblockDetailsPage__h3)} data-l10n-id='customFilters' />
            <div className={css(styles.adblockSubtext)} data-l10n-id='customFilterDescription' />
            <DefaultTextArea
              onChange={this.onChangeCustomFilters}
              value={getSetting(ADBLOCK_CUSTOM_RULES, this.state.settings) || ''}
              data-test-id='customFiltersInput'
              cols='100'
              rows='10'
              spellCheck='false' />
          </div>
        </div>
      </list>
    </div>
  }
  onChangeCustomFilters (e) {
    this.setState({
      settings: this.state.settings.set(ADBLOCK_CUSTOM_RULES, e.target.value)
    })
    aboutActions.updateCustomAdblockRules(e.target.value)
  }
}

const styles = StyleSheet.create({
  adblockDetailsPage: {
    margin: '20px',
    minWidth: '704px'
  },
  adblockDetailsPage__h2: {
    marginBottom: '10px'
  },
  adblockDetailsPage__h3: {
    marginTop: '20px',
    marginBottom: '10px'
  },
  adblockDetailsPageContent: {
    marginBottom: '10px'
  },
  adblockLists: {
    marginTop: '10px'
  },
  adblockSubtext: {
    fontSize: 'smaller',
    fontWeight: 'bold',
    marginBottom: '10px'
  }
})

module.exports = <AboutAdBlock />
