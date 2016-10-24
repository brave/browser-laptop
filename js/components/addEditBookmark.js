/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Button = require('./button')
const cx = require('../lib/classSet')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const KeyCodes = require('../../app/common/constants/keyCodes')
const siteTags = require('../constants/siteTags')
const settings = require('../constants/settings')
const siteUtil = require('../state/siteUtil')
const getSetting = require('../settings').getSetting

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
    this.onViewBookmarks = this.onViewBookmarks.bind(this)
    this.onRemoveBookmark = this.onRemoveBookmark.bind(this)
  }

  get isBlankTab () {
    return ['about:blank', 'about:newtab'].includes(this.props.currentDetail.get('location'))
  }

  get bookmarkNameValid () {
    const title = this.props.currentDetail.get('title') || this.props.currentDetail.get('customTitle')
    const location = this.props.currentDetail.get('location')

    return this.isFolder
      ? (typeof title === 'string' && title.trim().length > 0)
      : (typeof location === 'string' && location.trim().length > 0)
  }

  get isFolder () {
    return siteUtil.isFolder(this.props.currentDetail)
  }
  get heading () {
    if (this.isFolder) {
      return this.props.shouldShowLocation
        ? 'bookmarkFolderEditing'
        : 'bookmarkFolderAdding'
    }
    return this.props.shouldShowLocation
      ? (!this.props.originalDetail || !this.props.originalDetail.has('location'))
        ? 'bookmarkCreateNew'
        : 'bookmarkEdit'
      : 'bookmarkAdded'
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
    // Automatically save if this is triggered by the url star
    if (!this.props.shouldShowLocation) {
      this.onSave(false)
    }
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
    if (currentDetail.get('title') === e.target.value && e.target.value) {
      currentDetail = currentDetail.delete('customTitle')
    } else {
      currentDetail = currentDetail.set('customTitle', e.target.value)
    }

    windowActions.setBookmarkDetail(currentDetail, this.props.originalDetail, this.props.destinationDetail, this.props.shouldShowLocation)
  }
  onLocationChange (e) {
    const currentDetail = this.props.currentDetail.set('location', e.target.value)
    windowActions.setBookmarkDetail(currentDetail, this.props.originalDetail, this.props.destinationDetail, this.props.shouldShowLocation)
  }
  onParentFolderChange (e) {
    const currentDetail = this.props.currentDetail.set('parentFolderId', Number(e.target.value))
    windowActions.setBookmarkDetail(currentDetail, this.props.originalDetail, this.props.destinationDetail)
  }
  showToolbarOnFirstBookmark () {
    const hasBookmarks = this.props.sites.find(
      (site) => siteUtil.isBookmark(site) || siteUtil.isFolder(site)
    )
    if (!hasBookmarks && !getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)) {
      appActions.changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
    }
  }
  onSave (closeDialog = true) {
    // First check if the title of the currentDetail is set
    if (!this.bookmarkNameValid) {
      return false
    }

    this.showToolbarOnFirstBookmark()
    const tag = this.isFolder ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK
    appActions.addSite(this.props.currentDetail, tag, this.props.originalDetail, this.props.destinationDetail)
    if (closeDialog) {
      this.onClose()
    }
  }
  onRemoveBookmark () {
    const tag = this.isFolder ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK
    appActions.removeSite(this.props.currentDetail, tag)
    this.onClose()
  }
  onViewBookmarks () {
    this.onClose()
    windowActions.newFrame({location: 'about:bookmarks'}, true)
  }
  get displayBookmarkName () {
    if (this.props.currentDetail.get('customTitle') !== undefined) {
      return this.props.currentDetail.get('customTitle')
    }
    return this.props.currentDetail.get('title') || ''
  }
  render () {
    return <div className='bookmarkDialog'>
      <div className='bookmarkForm' onClick={this.onClick}>
        <div className={cx({
          arrowUp: true,
          withStopButton: this.props.withStopButton,
          withHomeButton: this.props.withHomeButton,
          withoutButtons: this.props.withoutButtons
        })} />
        <div className='bookmarkFormInner'>
          <h2 data-l10n-id={this.heading} />
          <div className='bookmarkFormTable'>
            <div id='bookmarkName' className='bookmarkFormRow'>
              <label data-l10n-id='nameField' htmlFor='bookmarkName' />
              <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onNameChange} value={this.displayBookmarkName} ref={(bookmarkName) => { this.bookmarkName = bookmarkName }} />
            </div>
            {
              !this.isFolder && this.props.shouldShowLocation
              ? <div id='bookmarkLocation' className='bookmarkFormRow'>
                <label data-l10n-id='locationField' htmlFor='bookmarkLocation' />
                <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onLocationChange} value={this.props.currentDetail.get('location')} />
              </div>
              : null
            }
            <div id='bookmarkParentFolder' className='bookmarkFormRow'>
              <label data-l10n-id='parentFolderField' htmlFor='bookmarkParentFolder' />
              <select value={this.props.currentDetail.get('parentFolderId')}
                onChange={this.onParentFolderChange} >
                <option value='0' data-l10n-id='bookmarksToolbar' />
                {
                  this.folders.map((folder) => <option value={folder.folderId}>{folder.label}</option>)
                }
              </select>
            </div>
            <div className='bookmarkButtons'>
              {
                this.props.originalDetail
                ? <Button l10nId='remove' className='primaryButton whiteButton inlineButton' onClick={this.onRemoveBookmark} />
                : null
              }
              <Button l10nId='done' disabled={!this.bookmarkNameValid} className='primaryButton' onClick={this.onSave} />
            </div>
          </div>
        </div>
        <div className='bookmarkFormFooter'>
          <Button l10nId='viewBookmarks' onClick={this.onViewBookmarks} />
        </div>
      </div>
    </div>
  }
}

module.exports = AddEditBookmark
