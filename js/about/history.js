/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const Immutable = require('immutable')
const urlutils = require('../lib/urlutil.js')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const aboutActions = require('./aboutActions')
const getSetting = require('../settings').getSetting
const SortableTable = require('../components/sortableTable')
const Button = require('../components/button')

const ipc = window.chrome.ipc

// Stylesheets
require('../../less/about/itemList.less')
require('../../less/about/siteDetails.less')
require('../../less/about/history.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class HistoryDay extends ImmutableComponent {
  navigate (entry) {
    aboutActions.newFrame({
      location: entry.location,
      partitionNumber: entry.partitionNumber
    })
  }
  render () {
    return <div>
      <div className='sectionTitle historyDayName'>{this.props.date}</div>
      <SortableTable headings={['time', 'title', 'domain']}
        rows={this.props.entries.map((entry) => [
          new Date(entry.get('lastAccessedTime')).toLocaleTimeString(),
          entry.get('customTitle') || entry.get('title')
            ? entry.get('customTitle') || entry.get('title')
            : entry.get('location'),
          urlutils.getHostname(entry.get('location'), true)
        ])}
        rowObjects={this.props.entries}
        columnClassNames={['time', 'title', 'domain']}
        addHoverClass
        onDoubleClick={this.navigate}
        contextMenuName='history'
        onContextMenu={aboutActions.contextMenu} />
    </div>
  }
}

class GroupedHistoryList extends ImmutableComponent {
  getDayString (locale, item) {
    return new Date(item.get('lastAccessedTime'))
      .toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }
  groupEntriesByDay (locale) {
    const reduced = this.props.history.reduce((previousValue, currentValue, currentIndex, array) => {
      const result = currentIndex === 1 ? [] : previousValue
      if (currentIndex === 1) {
        const firstDate = this.getDayString(locale, currentValue)
        result.push({date: firstDate, entries: [previousValue]})
      }
      const date = this.getDayString(locale, currentValue)
      const dateIndex = result.findIndex((entryByDate) => entryByDate.date === date)
      if (dateIndex !== -1) {
        result[dateIndex].entries.push(currentValue)
      } else {
        result.push({date: date, entries: [currentValue]})
      }
      return result
    })
    if (reduced) return reduced
    return []
  }
  render () {
    const defaultLanguage = this.props.languageCodes.find((lang) => lang.includes(navigator.language)) || 'en-US'
    const userLanguage = getSetting(settings.LANGUAGE, this.props.settings)
    return <list className='historyList'>
    {
      this.groupEntriesByDay(userLanguage || defaultLanguage).map((groupedEntry) =>
        <HistoryDay date={groupedEntry.date} entries={groupedEntry.entries} />)
    }
    </list>
  }
}

class AboutHistory extends React.Component {
  constructor () {
    super()
    this.onChangeSearch = this.onChangeSearch.bind(this)
    this.onClearSearchText = this.onClearSearchText.bind(this)
    this.clearBrowsingDataNow = this.clearBrowsingDataNow.bind(this)
    this.state = {
      history: Immutable.Map(),
      search: '',
      settings: Immutable.Map(),
      languageCodes: Immutable.Map()
    }
    ipc.on(messages.HISTORY_UPDATED, (e, detail) => {
      this.setState({ history: Immutable.fromJS(detail && detail.history || {}) })
    })
    ipc.on(messages.SETTINGS_UPDATED, (e, settings) => {
      this.setState({ settings: Immutable.fromJS(settings || {}) })
    })
    ipc.on(messages.LANGUAGE, (e, {languageCodes}) => {
      this.setState({ languageCodes })
    })
  }
  onChangeSearch (evt) {
    this.setState({
      search: evt.target.value
    })
  }
  onClearSearchText (evt) {
    this.setState({
      search: ''
    })
  }
  searchedSiteDetails (searchTerm, siteDetails) {
    return siteDetails.filter((siteDetail) => {
      const title = siteDetail.get('customTitle') + siteDetail.get('title') + siteDetail.get('location')
      return title.match(new RegExp(searchTerm, 'gi'))
    })
  }
  historyDescendingOrder () {
    return this.state.history.filter((site) => site.get('lastAccessedTime'))
      .sort((left, right) => {
        if (left.get('lastAccessedTime') < right.get('lastAccessedTime')) return 1
        if (left.get('lastAccessedTime') > right.get('lastAccessedTime')) return -1
        return 0
      }).slice(-500)
  }
  clearBrowsingDataNow () {
    aboutActions.clearBrowsingDataNow({browserHistory: true})
  }
  render () {
    return <div className='siteDetailsPage'>
      <div className='siteDetailsPageHeader'>
        <div data-l10n-id='history' className='sectionTitle' />
        <div className='headerActions'>
          <div className='searchWrapper'>
            <input type='text' className={this.state.search ? 'searchInput' : 'searchInput searchInputPlaceholder'} placeholder='&#xf002;' id='historySearch' value={this.state.search} onChange={this.onChangeSearch} data-l10n-id='historySearch' />
            {
              this.state.search
              ? <span onClick={this.onClearSearchText} className='fa fa-close searchInputClear'></span>
              : null
            }
          </div>
          <Button l10nId='clearBrowsingDataNow' className='primaryButton clearBrowsingDataButton' onClick={this.clearBrowsingDataNow} />
        </div>
      </div>

      <div className='siteDetailsPageContent'>
      {
        this.state.search
        ? <GroupedHistoryList
          languageCodes={this.state.languageCodes}
          settings={this.state.settings}
          history={this.searchedSiteDetails(this.state.search, this.state.history)} />
        : <GroupedHistoryList
          languageCodes={this.state.languageCodes}
          settings={this.state.settings}
          history={this.historyDescendingOrder()} />
       }
      </div>
    </div>
  }
}

module.exports = <AboutHistory />
