const prettierBytes = require('prettier-bytes')
const React = require('react')
const SortableTable = require('../../components/sortableTable')

const {css} = require('aphrodite/no-important')
const commonStyles = require('../../../app/renderer/components/styles/commonStyles')

class TorrentFileList extends React.Component {
  render () {
    const { torrent, stateOwner } = this.props
    const files = torrent && torrent.files

    let content
    if (files == null) {
      content = <div className={css(commonStyles.userSelectNone)} data-l10n-id='missingFilesList' />
    } else if (files.length === 0) {
      content = <div className={css(commonStyles.userSelectNone)} data-l10n-id='loadingFilesList' />
    } else {
      content = [
        <SortableTable
          headings={['num', 'name', 'downloadFile', 'size']}
          defaultHeading='num'
          defaultHeadingSortOrder='asc'
          rows={files.map((file, i) => [
            i + 1,
            {cell: this.renderFileLink(file, false)},
            {cell: this.renderFileLink(file, true)},
            prettierBytes(file.length)
          ])}
          rowObjects={files}
          columnClassNames={['num', 'name', 'downloadFile', 'size']}
          addHoverClass
          stateOwner={stateOwner} />
      ]
    }

    return (
      <div className='torrentFileList'>
        <div data-l10n-id='files' className='sectionTitle' />
        {content}
      </div>
    )
  }

  renderFileLink (file, isDownload) {
    const { torrentId, torrent, serverUrl } = this.props
    const ix = torrent.files.indexOf(file)
    if (isDownload) {
      if (serverUrl) {
        const httpURL = serverUrl + '/' + ix
        return <a className={css(commonStyles.userSelect)} href={httpURL} download={file.name}>⇩</a>
      } else {
        return <div /> // No download links until the server is ready
      }
    } else {
      const suffix = /^https?:/.test(torrentId)
        ? '#ix=' + ix
        : '&ix=' + ix
      const href = torrentId + suffix
      return <a className={css(commonStyles.userSelect)} href={href}>{file.name}</a>
    }
  }
}

module.exports = TorrentFileList
