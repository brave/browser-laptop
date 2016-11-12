const prettierBytes = require('prettier-bytes')
const React = require('react')
const SortableTable = require('../../components/sortableTable')

class TorrentFileList extends React.Component {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
  }

  onClick (file) {
    window.location = this.props.torrentID + '&ix=' + this.props.files.indexOf(file)
  }

  render () {
    const files = this.props.files

    if (files == null) {
      return <div data-l10n-id='missingFilesList' />
    } else if (files.length === 0) {
      return <div data-l10n-id='loadingFilesList' />
    } else {
      // TODO(feross): Add context menu support, like History page has.
      return <div className='torrentFileList'>
        <SortableTable headings={['name', 'size']}
          defaultHeading='name'
          defaultHeadingSortOrder='asc'
          rows={files.map((file) => [
            file.name,
            prettierBytes(file.length)
          ])}
          rowObjects={files}
          columnClassNames={['name', 'size']}
          addHoverClass
          stateOwner={this.props.stateOwner}
          onClick={this.onClick} />
      </div>
    }
  }
}

module.exports = TorrentFileList
