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
const ImmutableComponent = require('../components/immutableComponent')
const SwitchControl = require('../components/switchControl')

const ipc = window.chrome.ipcRenderer

// Stylesheets
require('../../less/switchControls.less')
require('../../less/about/itemList.less')
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
            <h3 data-l10n-id='additionalFilterLists' />
            <div className='adblockSubtext' data-l10n-id='adblockTooManyListsWarning' />
            <div className='adblockLists'>
              {
                this.state.resources.map((resource) =>
                  <AdBlockItem resource={resource}
                    settings={this.state.settings} />)
              }
            </div>
            <h3 data-l10n-id='customFilters' />
            <div className='adblockSubtext' data-l10n-id='customFilterDescription' />
            <textarea
              onChange={this.onChangeCustomFilters}
              value={getSetting(ADBLOCK_CUSTOM_RULES, this.state.settings) || ''}
              className='customFiltersInput'
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

module.exports = <AboutAdBlock />
