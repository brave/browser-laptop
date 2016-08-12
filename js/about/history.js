/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const Immutable = require('immutable')
const Sticky = require('react-stickynode')
const ImmutableComponent = require('../components/immutableComponent')
const messages = require('../constants/messages')
const aboutActions = require('./aboutActions')

const ipc = window.chrome.ipc

// Stylesheets
require('../../less/about/itemList.less')
require('../../less/about/history.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class HistoryItem extends ImmutableComponent {
  navigate () {
    aboutActions.newFrame({
      location: this.props.history.get('location'),
      partitionNumber: this.props.history.get('partitionNumber')
    })
  }
  render () {
    // Figure out the partition info display
    let partitionNumberInfo
    if (this.props.history.get('partitionNumber')) {
      let l10nArgs = {
        partitionNumber: this.props.history.get('partitionNumber')
      }
      partitionNumberInfo =
        <span>&nbsp;(<span data-l10n-id='partitionNumber' data-l10n-args={JSON.stringify(l10nArgs)} />)</span>
    }

    var className = 'listItem'

    // If the history item is in the selected folder, show
    // it as selected
    if (this.props.inSelectedFolder) {
      className += ' selected'
    }

    return <div role='listitem'
      className={className}
      onContextMenu={aboutActions.contextMenu.bind(this, this.props.history.toJS(), 'history')}
      data-context-menu-disable
      onDoubleClick={this.navigate.bind(this)}>
    {
      this.props.history.get('customTitle') || this.props.history.get('title')
      ? <span className='aboutListItem' title={this.props.history.get('location')}>
        <span className='aboutItemDate'>{new Date(this.props.history.get('lastAccessedTime')).toLocaleDateString()}</span>
        <span className='aboutItemTitle'>{this.props.history.get('customTitle') || this.props.history.get('title')}</span>
        {partitionNumberInfo}
        <span className='aboutItemSeparator'>-</span><span className='aboutItemLocation'>{this.props.history.get('location')}</span>
      </span>
      : <span className='aboutListItem' title={this.props.history.get('location')}>
        <span className='aboutItemDate'>{new Date(this.props.history.get('lastAccessedTime')).toLocaleDateString()}</span>
        <span>{this.props.history.get('location')}</span>
        {partitionNumberInfo}
      </span>
    }
    </div>
  }
}

class HistoryList extends ImmutableComponent {
  render () {
    return <list className='historyList'>
    {
      this.props.history.map((entry) =>
        <HistoryItem history={entry} />)
    }
    </list>
  }
}

class AboutHistory extends React.Component {
  constructor () {
    super()
    this.onChangeSelectedEntry = this.onChangeSelectedEntry.bind(this)
    this.onChangeSearch = this.onChangeSearch.bind(this)
    this.onClearSearchText = this.onClearSearchText.bind(this)
    this.state = {
      history: Immutable.Map(),
      selectedEntry: 0,
      search: ''
    }
    ipc.on(messages.HISTORY_UPDATED, (e, detail) => {
      this.setState({
        history: Immutable.fromJS(detail && detail.history || {})
      })
    })
  }
  onChangeSelectedEntry (id) {
    this.setState({
      selectedEntry: id,
      search: ''
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
  render () {
    return <div className='historyPage'>
      <h2 data-l10n-id='history' />

      <div className='historyPageContent'>
        <Sticky enabled top={10}>
          <HistoryList history={this.state.history.filter((site) => site.get('tags').isEmpty())}
            onChangeSelectedEntry={this.onChangeSelectedEntry}
            selectedEntry={this.state.selectedEntry} />
        </Sticky>
      </div>
    </div>
  }
}

module.exports = <AboutHistory />
