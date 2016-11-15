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

    let content
    if (files == null) {
      content = <div data-l10n-id='missingFilesList' />
    } else if (files.length === 0) {
      content = <div data-l10n-id='loadingFilesList' />
    } else {
      // TODO(feross): Add context menu support, like History page has.
      content = [
        <div data-l10n-id='files' className='sectionTitle' />,
        <SortableTable
          headings={['num', 'name', 'size']}
          defaultHeading='num'
          defaultHeadingSortOrder='asc'
          rows={files.map((file, i) => [
            String(i + 1),
            file.name,
            prettierBytes(file.length)
          ])}
          rowObjects={files}
          columnClassNames={['num', 'name', 'size']}
          addHoverClass
          stateOwner={this.props.stateOwner}
          onClick={this.onClick} />
      ]
    }

    return (
      <div className='torrentFileList'>
        {content}
      </div>
    )
  }
}

module.exports = TorrentFileList
