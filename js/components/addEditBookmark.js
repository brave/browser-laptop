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
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const siteUtil = require('../state/siteUtil')
const getSetting = require('../settings').getSetting
const ipc = global.require('electron').ipcRenderer

class AddEditBookmark extends ImmutableComponent {
  constructor () {
    super()
    this.onNameChange = this.onNameChange.bind(this)
    this.onLocationChange = this.onLocationChange.bind(this)
    this.onParentFolderChange = this.onParentFolderChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onClose = this.onClose.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onSave = this.onSave.bind(this)
    this.onRemoveBookmark = this.onRemoveBookmark.bind(this)
  }

  get isBlankTab () {
    return ['about:blank', 'about:newtab'].includes(this.props.currentDetail.get('location'))
  }

  get bookmarkNameValid () {
    let title = (this.props.currentDetail.get('title') || this.props.currentDetail.get('customTitle'))
    return ((typeof title === 'string') && title.trim().length > 0)
  }

  get isFolder () {
    return siteUtil.isFolder(this.props.currentDetail)
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
    const currentDetail = this.props.currentDetail.set('parentFolderId', Number(e.target.value))
    windowActions.setBookmarkDetail(currentDetail, this.props.originalDetail, this.props.destinationDetail)
  }
  showToolbarOnFirstBookmark () {
    const showBookmarksToolbar = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)
    const isFirstBookmark = this.props.sites.find(
      (site) => siteUtil.isBookmark(site) || siteUtil.isFolder(site)
    )
    appActions.changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, !isFirstBookmark || showBookmarksToolbar)
  }
  updateMenuBookmarkedStatus (isBookmarked) {
    ipc.send(messages.UPDATE_MENU_BOOKMARKED_STATUS, isBookmarked)
  }
  onSave () {
    // First check if the title of the currentDetail is set
    if (!this.bookmarkNameValid) {
      return false
    }

    this.showToolbarOnFirstBookmark()
    const tag = this.isFolder ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK
    appActions.addSite(this.props.currentDetail, tag, this.props.originalDetail, this.props.destinationDetail)
    this.updateMenuBookmarkedStatus(true)
    this.onClose()
  }
  onRemoveBookmark () {
    appActions.removeSite(this.props.currentDetail, siteTags.BOOKMARK)
    this.updateMenuBookmarkedStatus(false)
    this.onClose()
  }
  get displayBookmarkName () {
    if (this.props.currentDetail.get('customTitle') !== undefined) {
      return this.props.currentDetail.get('customTitle')
    }
    return this.props.currentDetail.get('title') || this.props.currentDetail.get('location')
  }
  render () {
    return <Dialog onHide={this.onClose} isClickDismiss>
      <div className='genericForm' onClick={this.onClick}>
        <div className='genericFormTable'>
          <div id='bookmarkName' className='formRow'>
            <label data-l10n-id='nameField' htmlFor='bookmarkName' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onNameChange} value={this.displayBookmarkName} ref={(bookmarkName) => { this.bookmarkName = bookmarkName }} />
          </div>
          {
            !this.isFolder
            ? <div id='bookmarkLocation' className='formRow'>
              <label data-l10n-id='locationField' htmlFor='bookmarkLocation' />
              <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onLocationChange} value={this.props.currentDetail.get('location')} />
            </div>
            : null
          }
          <div id='bookmarkParentFolder' className='formRow'>
            <label data-l10n-id='parentFolderField' htmlFor='bookmarkParentFolderk' />
            <select value={this.props.currentDetail.get('parentFolderId')}
              onChange={this.onParentFolderChange} >
              <option value='0' data-l10n-id='bookmarksToolbar' />
            {
              this.folders.map((folder) => <option value={folder.folderId}>{folder.label}</option>)
            }
            </select>
          </div>
          <div className='formRow'>
            {
              this.props.originalDetail
              ? <a data-l10n-id='delete' className='removeBookmarkLink link' onClick={this.onRemoveBookmark} />
              : null
            }
            <Button l10nId='save' disabled={!this.bookmarkNameValid} className='primaryButton' onClick={this.onSave} />
          </div>
        </div>
      </div>
    </Dialog>
  }
}

module.exports = AddEditBookmark
