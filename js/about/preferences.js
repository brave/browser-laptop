/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const Immutable = require('immutable')
const cx = require('../lib/classSet.js')
const appConfig = require('../constants/appConfig')
const preferenceTabs = require('../constants/preferenceTabs')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const aboutActions = require('./aboutActions')
const getSetting = require('../settings').getSetting

// TODO: Determine this from the l20n file automatically
const hintCount = 3

// Stylesheets
require('../../less/about/preferences.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

const changeSetting = (cb, key, e) => {
  if (e.target.type === 'checkbox') {
    cb(key, e.target.checked)
  } else {
    let value = e.target.value
    if (e.target.type === 'number') {
      value = value.replace(/\D/g, '')
      value = parseInt(value, 10)
      if (Number.isNaN(value)) {
        return
      }
      value = Math.min(e.target.getAttribute('max'), Math.max(value, e.target.getAttribute('min')))
    }
    cb(key, value)
  }
}

class SettingsList extends ImmutableComponent {
  render () {
    return <div>
      { this.props.dataL10nId
        ? <div className='settingsListTitle' data-l10n-id={this.props.dataL10nId}/> : null }
      <div className='settingsList'>
        {this.props.children}
      </div>
    </div>
  }
}

class SettingItem extends ImmutableComponent {
  render () {
    return <div className='settingItem'>
      <span data-l10n-id={this.props.dataL10nId}/>
      {this.props.children}
    </div>
  }
}

class SettingCheckbox extends ImmutableComponent {
  render () {
    return <div className='settingItem'>
      <span className='checkboxContainer'>
        <input type='checkbox' id={this.props.prefKey}
          disabled={this.props.disabled}
          onChange={changeSetting.bind(null, this.props.onChangeSetting, this.props.prefKey)}
          checked={getSetting(this.props.prefKey, this.props.settings)}/>
      </span>
      <label data-l10n-id={this.props.dataL10nId} htmlFor={this.props.prefKey}/>
    </div>
  }
}

class GeneralTab extends ImmutableComponent {
  render () {
    return <SettingsList>
      <SettingItem dataL10nId='startsWith'>
        <select value={getSetting(settings.STARTUP_MODE, this.props.settings)}
          onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.STARTUP_MODE)} >
          <option data-l10n-id='startsWithOptionLastTime' value='lastTime'/>
          <option data-l10n-id='startsWithOptionHomePage' value='homePage'/>
          <option data-l10n-id='startsWithOptionNewTabPage' value='newTabPage'/>
        </select>
      </SettingItem>
      <SettingItem dataL10nId='myHomepage'>
        <input data-l10n-id='homepageInput'
          value={getSetting(settings.HOMEPAGE, this.props.settings)}
          onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.HOMEPAGE)} />
      </SettingItem>
    </SettingsList>
  }
}

class SearchTab extends ImmutableComponent {
  render () {
    return <SettingsList>
      <SettingItem dataL10nId='defaultSearchEngine'>
        <select value={getSetting(settings.DEFAULT_SEARCH_ENGINE, this.props.settings)}
          onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.DEFAULT_SEARCH_ENGINE)}>
          <option value='./content/search/google.xml'>Google</option>
          <option value='./content/search/duckduckgo.xml'>DuckDuckGo</option>
        </select>
      </SettingItem>
    </SettingsList>
  }
}

class TabsTab extends ImmutableComponent {
  render () {
    return <SettingsList>
      <SettingItem dataL10nId='tabsPerTabPage'>
        <input
          type='number'
          min='3'
          max='20'
          value={getSetting(settings.TABS_PER_TAB_PAGE, this.props.settings)}
          onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.TABS_PER_TAB_PAGE)} />
      </SettingItem>
      <SettingCheckbox dataL10nId='switchToNewTabs' prefKey={settings.SWITCH_TO_NEW_TABS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting}/>
      <SettingCheckbox dataL10nId='paintTabs' prefKey={settings.PAINT_TABS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting}/>
      <SettingCheckbox dataL10nId='showTabPreviews' prefKey={settings.SHOW_TAB_PREVIEWS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting}/>
    </SettingsList>
  }
}

class SyncTab extends ImmutableComponent {
  render () {
    return <div>
      Sync settings coming soon
    </div>
  }
}

class PrivacyTab extends ImmutableComponent {
  render () {
    return <div>
      <SettingsList dataL10nId='suggestionTypes'>
        <SettingCheckbox dataL10nId='history' prefKey={settings.HISTORY_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting}/>
        <SettingCheckbox dataL10nId='bookmarks' prefKey={settings.BOOKMARK_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting}/>
        <SettingCheckbox dataL10nId='openedTabs' prefKey={settings.OPENED_TAB_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting}/>
      </SettingsList>
      <SettingsList dataL10nId='advancedPrivacySettings'>
        <SettingCheckbox dataL10nId='doNotTrack' prefKey={settings.DO_NOT_TRACK} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting}/>
      </SettingsList>
    </div>
  }
}

class SecurityTab extends ImmutableComponent {
  render () {
    return <SettingsList>
      <SettingCheckbox disabled dataL10nId='blockAttackSites' prefKey={settings.BLOCK_REPORTED_SITES} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting}/>
    </SettingsList>
  }
}

class BraveryTab extends ImmutableComponent {
  render () {
    return <div>
      Bravery settings coming soon
    </div>
  }
}

class TopBarButton extends ImmutableComponent {
  render () {
    return <div className={cx({
      selected: this.props.selected,
      [this.props.className]: !!this.props.className
    })}>
      <div onClick={this.props.onClick}
        className={cx({
          topBarButton: true,
          fa: true,
          [this.props.icon]: true
        })}>
        <div className='tabMarkerText'
          data-l10n-id={this.props.dataL10nId}/>
      </div>
      { this.props.selected
      ? <div className='tabMarkerContainer'>
          <div className='tabMarker'/>
        </div> : null }
    </div>
  }
}

class TopBar extends ImmutableComponent {
  render () {
    return <div className='preferencesTopBar'>
      <TopBarButton icon='fa-list-alt'
        dataL10nId='general'
        onClick={this.props.changeTab.bind(null, preferenceTabs.GENERAL)}
        selected={this.props.preferenceTab === preferenceTabs.GENERAL}
      />
      <TopBarButton icon='fa-search'
        dataL10nId='search'
        onClick={this.props.changeTab.bind(null, preferenceTabs.SEARCH)}
        selected={this.props.preferenceTab === preferenceTabs.SEARCH}
      />
      <TopBarButton icon='fa-bookmark-o'
        dataL10nId='tabs'
        onClick={this.props.changeTab.bind(null, preferenceTabs.TABS)}
        selected={this.props.preferenceTab === preferenceTabs.TABS}
      />
      <TopBarButton icon='fa-refresh'
        dataL10nId='sync'
        className='notImplemented'
        onClick={this.props.changeTab.bind(null, preferenceTabs.SYNC)}
        selected={this.props.preferenceTab === preferenceTabs.SYNC}
      />
      <TopBarButton icon='fa-user'
        dataL10nId='privacy'
        onClick={this.props.changeTab.bind(null, preferenceTabs.PRIVACY)}
        selected={this.props.preferenceTab === preferenceTabs.PRIVACY}
      />
      <TopBarButton icon='fa-lock'
        dataL10nId='security'
        onClick={this.props.changeTab.bind(null, preferenceTabs.SECURITY)}
        selected={this.props.preferenceTab === preferenceTabs.SECURITY}
      />
      <TopBarButton onClick={this.props.changeTab.bind(null, preferenceTabs.BRAVERY)}
        dataL10nId='bravery'
        className='notImplemented'
        selected={this.props.preferenceTab === preferenceTabs.BRAVERY}
      />
    </div>
  }
}

class HelpfulHints extends ImmutableComponent {
  render () {
    return <div className='helpfulHints'>
      <span className='hintsTitleContainer'>
        <span data-l10n-id='hintsTitle'/>
        <span className='hintsRefresh fa fa-refresh'
          onClick={this.props.refreshHint}/>
      </span>
      <div data-l10n-id={`hint${this.props.hintNumber}`}/>
      <div className='helpfulHintsBottom'>
        <a data-l10n-id='sendUsFeedback' href={appConfig.contactUrl} />
        <div className='loveToHear' data-l10n-id='loveToHear'/>
      </div>
    </div>
  }
}

class AboutPreferences extends React.Component {
  constructor () {
    super()
    this.state = {
      preferenceTab: preferenceTabs.GENERAL,
      hintNumber: this.getNextHintNumber(),
      settings: window.initSettings ? Immutable.fromJS(window.initSettings) : Immutable.Map()
    }
    window.addEventListener(messages.SETTINGS_UPDATED, (e) => {
      this.setState({
        settings: Immutable.fromJS(e.detail || {})
      })
    })
    this.onChangeSetting = this.onChangeSetting.bind(this)
  }

  changeTab (preferenceTab) {
    this.setState({
      preferenceTab
    })
  }

  refreshHint () {
    this.setState({
      hintNumber: this.getNextHintNumber()
    })
  }

  getNextHintNumber () {
    // Try for a new random number at most 10 times.
    // Avoiding the same tip twice is good because people may think the
    // refresh button is broken.
    let newNumber
    for (let i = 0; i < 10; ++i) {
      newNumber = Math.random() * hintCount | 0
      if (!this.state || newNumber !== this.state.hintNumber) {
        break
      }
    }
    return newNumber
  }

  onChangeSetting (key, value) {
    this.setState({
      settings: this.state.settings.set(key, value)
    })
    aboutActions.changeSetting(key, value)
  }

  render () {
    let tab
    const settings = this.state.settings
    switch (this.state.preferenceTab) {
      case preferenceTabs.GENERAL:
        tab = <GeneralTab settings={settings} onChangeSetting={this.onChangeSetting}/>
        break
      case preferenceTabs.SEARCH:
        tab = <SearchTab settings={settings} onChangeSetting={this.onChangeSetting}/>
        break
      case preferenceTabs.TABS:
        tab = <TabsTab settings={settings} onChangeSetting={this.onChangeSetting}/>
        break
      case preferenceTabs.SYNC:
        tab = <SyncTab settings={settings} onChangeSetting={this.onChangeSetting}/>
        break
      case preferenceTabs.PRIVACY:
        tab = <PrivacyTab settings={settings} onChangeSetting={this.onChangeSetting}/>
        break
      case preferenceTabs.SECURITY:
        tab = <SecurityTab settings={settings} onChangeSetting={this.onChangeSetting}/>
        break
      case preferenceTabs.BRAVERY:
        tab = <BraveryTab settings={settings} onChangeSetting={this.onChangeSetting}/>
        break
    }
    return <div>
      <TopBar preferenceTab={this.state.preferenceTab}
        changeTab={this.changeTab.bind(this)}/>
      <div className='prefBody'>
        <div className='prefTabContainer'>
          {tab}
        </div>
        <HelpfulHints hintNumber={this.state.hintNumber} refreshHint={this.refreshHint.bind(this)}/>
      </div>
    </div>
  }
}

module.exports = <AboutPreferences/>
