/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Dialog = require('./dialog')
const Button = require('./button')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const KeyCodes = require('../constants/keyCodes')
const siteTags = require('../constants/siteTags')
const siteUtil = require('../state/siteUtil')

class AddEditBookmark extends ImmutableComponent {
  constructor () {
    super()
    this.onNameChange = this.onNameChange.bind(this)
    this.onLocationChange = this.onLocationChange.bind(this)
    this.onParentFolderChange = this.onParentFolderChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onClose = this.onClose.bind(this)
  }
  get isBlankTab () {
    return ['about:blank', 'about:newtab'].includes(this.props.currentDetail.get('location'))
  }
  get isFolder () {
    return this.props.currentDetail.get('tags').includes(siteTags.BOOKMARK_FOLDER)
  }
  updateFolders (props) {
    this.folders = siteUtil.getFolders(this.props.sites, props.currentDetail.get('folderId'))
  }
  componentWillMount () {
    this.updateFolders(this.props)
  }
  componentWillUpdate (nextProps) {
    if (this.props.sites !== nextProps.sites) {
      this.updateFolders(nextProps)
    }
  }
  componentDidMount () {
    this.bookmarkName.select()
    this.bookmarkName.focus()
  }
  onKeyDown (e) {
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        this.onSave()
        break
      case KeyCodes.ESC:
        this.onClose()
        break
    }
  }
  onClose () {
    windowActions.setBookmarkDetail()
  }
  onClick (e) {
    e.stopPropagation()
  }
  onNameChange (e) {
    let currentDetail = this.props.currentDetail
    if (currentDetail.get('title') === e.target.value) {
      currentDetail = currentDetail.delete('customTitle')
    } else {
      currentDetail = currentDetail.set('customTitle', e.target.value)
    }
    windowActions.setBookmarkDetail(currentDetail, this.props.originalDetail, this.props.destinationDetail)
  }
  onLocationChange (e) {
    const currentDetail = this.props.currentDetail.set('location', e.target.value)
    windowActions.setBookmarkDetail(currentDetail, this.props.originalDetail, this.props.destinationDetail)
  }
  onParentFolderChange (e) {
    const currentDetail = this.props.currentDetail.set('parentFolderId', e.target.value)
    windowActions.setBookmarkDetail(currentDetail, this.props.originalDetail, this.props.destinationDetail)
  }
  onSave () {
    const tag = this.isFolder ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK
    appActions.addSite(this.props.currentDetail, tag, this.props.originalDetail, this.props.destinationDetail)
    this.onClose()
  }
  render () {
    return <Dialog onHide={this.onClose} isClickDismiss>
      <div className='addEditBookmark' onClick={this.onClick.bind(this)}>
        <div id='bookmarkName' className='bookmarkFormRow'>
          <label data-l10n-id='nameField' htmlFor='bookmarkName'/>
          <input onKeyDown={this.onKeyDown} onChange={this.onNameChange} value={this.props.currentDetail.get('customTitle') || this.props.currentDetail.get('title')} ref={bookmarkName => this.bookmarkName = bookmarkName }/>
        </div>
        { !this.isFolder
          ? <div id='bookmarkLocation' className='bookmarkFormRow'>
          <label data-l10n-id='locationField' htmlFor='bookmarkLocation'/>
          <input onKeyDown={this.onKeyDown} onChange={this.onLocationChange} value={this.props.currentDetail.get('location')} />
        </div> : null }
        <div id='bookmarkParentFolder' className='bookmarkFormRow'>
          <label data-l10n-id='parentFolderField' htmlFor='bookmarkParentFolderk'/>
          <select value={this.props.currentDetail.get('parentFolderId')}
            onChange={this.onParentFolderChange} >
          <option value='0' data-l10n-id='bookmarksToolbar'/>
          { this.folders.map(folder => <option value={folder.folderId}>{folder.label}</option>)}
          </select>
        </div>
        <div className='bookmarkFormRow'>
          <span/>
          <Button l10nId='save' className='primaryButton' onClick={this.onSave.bind(this)}/>
        </div>
      </div>
    </Dialog>
  }
}

module.exports = AddEditBookmark
