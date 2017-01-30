/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const Immutable = require('immutable')
const urlutils = require('../lib/urlutil')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const aboutActions = require('./aboutActions')
const getSetting = require('../settings').getSetting
const SortableTable = require('../components/sortableTable')
const Button = require('../components/button')
const {makeImmutable} = require('../../app/common/state/immutableUtil')
const historyUtil = require('../../app/common/lib/historyUtil')

const ipc = window.chrome.ipcRenderer

// Stylesheets
require('../../less/about/history.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

// TODO(bsclifton): this button is currently hidden (along with column icon)
// When ready, this can be shown again (by updating style in history.less)
// When that happens, be sure to also show the ::before (which has trash can icon)
class DeleteHistoryEntryButton extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
  }
  onClick (e) {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    // TODO(bsclifton): delete the selected entry
  }
  render () {
    return <div className='fa fa-times deleteEntry' onClick={this.onClick} />
  }
}

class HistoryTimeCell extends ImmutableComponent {
  render () {
    return <div>
      <DeleteHistoryEntryButton siteDetail={this.props.siteDetail} />
      {
        this.props.siteDetail.get('lastAccessedTime')
          ? new Date(this.props.siteDetail.get('lastAccessedTime')).toLocaleTimeString()
          : ''
      }
    </div>
  }
}

class HistoryDay extends ImmutableComponent {
  navigate (entry) {
    entry = makeImmutable(entry)
    aboutActions.createTabRequested({
      url: entry.get('location'),
      partitionNumber: entry.get('partitionNumber')
    })
  }
  render () {
    return <div>
      <div className='sectionTitle historyDayName'>{this.props.date}</div>
      <SortableTable headings={['time', 'title', 'domain']}
        defaultHeading='time'
        defaultHeadingSortOrder='desc'
        rows={this.props.entries.map((entry) => [
          {
            cell: <HistoryTimeCell siteDetail={entry} />,
            value: entry.get('lastAccessedTime')
          },
          entry.get('title')
            ? entry.get('title')
            : entry.get('location'),
          urlutils.getHostname(entry.get('location'), true)
        ])}
        rowObjects={this.props.entries}
        totalRowObjects={this.props.totalEntries.toJS()}
        tableID={this.props.tableID}
        columnClassNames={['time', 'title', 'domain']}
        addHoverClass
        multiSelect
        stateOwner={this.props.stateOwner}
        onDoubleClick={this.navigate}
        contextMenuName='history'
        onContextMenu={aboutActions.contextMenu} />
    </div>
  }
}

class GroupedHistoryList extends React.Component {
  render () {
    const defaultLanguage = this.props.languageCodes.find((lang) => lang.includes(navigator.language)) || 'en-US'
    const userLanguage = getSetting(settings.LANGUAGE, this.props.settings) || defaultLanguage
    const entriesByDay = historyUtil.groupEntriesByDay(this.props.history, userLanguage)
    const totalEntries = historyUtil.totalEntries(entriesByDay)
    let index = 0
    return <list className='historyList'>
      {
        entriesByDay.map((groupedEntry) =>
          <HistoryDay
            date={groupedEntry.get('date')}
            entries={groupedEntry.get('entries')}
            totalEntries={totalEntries}
            tableID={index++}
            stateOwner={this.props.stateOwner}
          />)
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
    this.clearSelection = this.clearSelection.bind(this)
    this.onClick = this.onClick.bind(this)
    this.state = {
      history: Immutable.List(),
      search: '',
      settings: Immutable.Map(),
      languageCodes: Immutable.Map(),
      selection: Immutable.Set(),
      updatedStamp: undefined
    }
    ipc.on(messages.HISTORY_UPDATED, (e, detail) => {
      const aboutHistory = Immutable.fromJS(detail || {})
      const updatedStamp = aboutHistory.get('updatedStamp')
      // Only update if the data has changed.
      if (typeof updatedStamp === 'number' &&
          typeof this.state.updatedStamp === 'number' &&
          updatedStamp === this.state.updatedStamp) {
        return
      }
      this.setState({
        history: aboutHistory.get('entries') || new Immutable.List(),
        updatedStamp: updatedStamp
      })
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
  onClick (e) {
    // Determine if click was on sortableTable
    let targetElement = e.target
    while (targetElement) {
      if (targetElement.tagName === 'TBODY' || targetElement.tagName === 'THEAD') {
        return
      }
      targetElement = targetElement.parentNode
    }
    // Click was not a child element of sortableTable; clear selection
    this.clearSelection()
  }
  searchedSiteDetails (searchTerm, siteDetails) {
    return siteDetails.filter((siteDetail) => {
      const title = siteDetail.get('title') + siteDetail.get('location')
      return title.match(new RegExp(searchTerm, 'gi'))
    })
  }
  clearBrowsingDataNow () {
    aboutActions.clearBrowsingDataNow({browserHistory: true})
  }
  clearSelection () {
    this.setState({
      selection: new Immutable.Set()
    })
  }
  componentDidMount () {
    this.refs.historySearch.focus()
  }
  render () {
    return <div className='siteDetailsPage' onClick={this.onClick}>
      <div className='siteDetailsPageHeader'>
        <div data-l10n-id='history' className='sectionTitle' />
        <div className='headerActions'>
          <div className='searchWrapper'>
            <input type='text' className='searchInput' ref='historySearch' id='historySearch' value={this.state.search} onChange={this.onChangeSearch} data-l10n-id='historySearch' />
            {
              this.state.search
              ? <span onClick={this.onClearSearchText} className='fa fa-close searchInputClear' />
              : <span className='fa fa-search searchInputPlaceholder' />
            }
          </div>
          <Button l10nId='clearBrowsingDataNow' className='primaryButton clearBrowsingDataButton' onClick={this.clearBrowsingDataNow} />
        </div>
      </div>

      <div className='siteDetailsPageContent'>
        <GroupedHistoryList
          languageCodes={this.state.languageCodes}
          settings={this.state.settings}
          history={
            this.state.search
            ? this.searchedSiteDetails(this.state.search, this.state.history)
            : this.state.history
          }
          stateOwner={this} />
      </div>
    </div>
  }
}

module.exports = <AboutHistory />
