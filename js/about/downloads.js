/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('../components/immutableComponent')
const messages = require('../constants/messages')
const aboutActions = require('./aboutActions')
const downloadUtil = require('../state/downloadUtil')

const ipc = window.chrome.ipcRenderer

// Stylesheets
require('../../less/about/itemList.less')
require('../../less/about/downloads.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class DownloadItem extends ImmutableComponent {
  render () {
    const l10nStateArgs = {}
    if (downloadUtil.isPendingState(this.props.download)) {
      l10nStateArgs.downloadPercent = downloadUtil.getPercentageComplete(this.props.download)
    }
    const contextMenuDownload = this.props.download.toJS()
    contextMenuDownload.downloadId = this.props.downloadId
    return <div role='listitem'
      className='listItem'
      onContextMenu={aboutActions.contextMenu.bind(this, contextMenuDownload, 'download')}
      data-context-menu-disable
      onDoubleClick={aboutActions.openDownloadPath.bind(this, this.props.download)}>
      {
        <div className='aboutListItem' title={this.props.download.get('url')}>
          <div className='aboutItemTitle'>{this.props.download.get('filename')}</div>
          <div className='aboutItemTitle' data-l10n-id={downloadUtil.getL10nId(this.props.download)} data-l10n-args={JSON.stringify(l10nStateArgs)} />
          <div className='aboutItemLocation'>{this.props.download.get('url')}</div>
        </div>
      }
    </div>
  }
}

class DownloadsList extends ImmutableComponent {
  render () {
    return <list className='downloadList'>
      {
        this.props.downloads.size > 0
        ? this.props.downloads.map((download, downloadId) =>
          <DownloadItem download={download} downloadId={downloadId} />)
        : <div className='downloadList' data-l10n-id='noDownloads' />
      }
    </list>
  }
}

class AboutDownloads extends React.Component {
  constructor () {
    super()
    this.state = {
      downloads: Immutable.Map()
    }
    ipc.on(messages.DOWNLOADS_UPDATED, (e, detail) => {
      this.setState({
        downloads: Immutable.fromJS(detail && detail.downloads || {})
          .sort((x, y) => y.get('startTime') - x.get('startTime'))
      })
    })
  }
  render () {
    return <div className='downloadsPage'>
      <h2 data-l10n-id='downloads' />
      <div className='downloadPageContent'>
        <DownloadsList downloads={this.state.downloads} />
      </div>
    </div>
  }
}

module.exports = <AboutDownloads />
