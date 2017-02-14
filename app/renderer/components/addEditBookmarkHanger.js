/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const Button = require('../../../js/components/button')
const cx = require('../../../js/lib/classSet')
const windowActions = require('../../../js/actions/windowActions')
const appActions = require('../../../js/actions/appActions')
const KeyCodes = require('../../common/constants/keyCodes')
const siteTags = require('../../../js/constants/siteTags')
const settings = require('../../../js/constants/settings')
const siteUtil = require('../../../js/state/siteUtil')
const UrlUtil = require('../../../js/lib/urlutil')
const getSetting = require('../../../js/settings').getSetting

class AddEditBookmarkHanger extends ImmutableComponent {
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
  get bookmarkNameValid () {
    const title = this.props.currentDetail.get('title') || this.props.currentDetail.get('customTitle')
    const location = this.props.currentDetail.get('location')
    return this.isFolder
      ? (typeof title === 'string' && title.trim().length > 0)
      : (typeof location === 'string' && location.trim().length > 0)
  }
  get displayBookmarkName () {
    if (this.props.currentDetail.get('customTitle') !== undefined) {
      return this.props.currentDetail.get('customTitle')
    }
    return this.props.currentDetail.get('title') || ''
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
  get isFolder () {
    // Fake a folderId property so that the bookmark is considered a bookmark folder.
    // This is ImmutableJS so it doesn't actually set a value, it just returns a new one.
    return siteUtil.isFolder(this.props.currentDetail.set('folderId', 0))
  }
  setDefaultFocus () {
    this.bookmarkName.select()
    this.bookmarkName.focus()
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
    if (!this.props.isModal && !this.props.shouldShowLocation) {
      this.onSave(false)
    }
    this.setDefaultFocus()
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
    let name = e.target.value
    if (typeof name === 'string' && UrlUtil.isURL(name)) {
      const punycodeUrl = UrlUtil.getPunycodeUrl(name)
      if (punycodeUrl.replace(/\/$/, '') !== name) {
        name = punycodeUrl
      }
    }
    if (currentDetail.get('title') === name && name) {
      currentDetail = currentDetail.delete('customTitle')
    } else {
      currentDetail = currentDetail.set('customTitle', name)
    }
    windowActions.setBookmarkDetail(currentDetail, this.props.originalDetail, this.props.destinationDetail, this.props.shouldShowLocation, !this.props.isModal)
  }
  onLocationChange (e) {
    let location = e.target.value
    if (typeof location === 'string') {
      const punycodeUrl = UrlUtil.getPunycodeUrl(location)
      if (punycodeUrl.replace(/\/$/, '') !== location) {
        location = punycodeUrl
      }
    }
    const currentDetail = this.props.currentDetail.set('location', location)
    windowActions.setBookmarkDetail(currentDetail, this.props.originalDetail, this.props.destinationDetail, this.props.shouldShowLocation, !this.props.isModal)
  }
  onParentFolderChange (e) {
    const currentDetail = this.props.currentDetail.set('parentFolderId', Number(e.target.value))
    windowActions.setBookmarkDetail(currentDetail, this.props.originalDetail, this.props.destinationDetail, undefined, !this.props.isModal)
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
  render () {
    const props = this.props.isModal
      ? {
        className: 'fa fa-close',
        onClick: this.onClose
      }
      : {
        className: cx({
          arrowUp: true,
          withStopButton: this.props.withStopButton,
          withHomeButton: this.props.withHomeButton,
          withoutButtons: this.props.withoutButtons
        })
      }
    return <div className={cx({
      bookmarkDialog: this.props.isModal,
      bookmarkHanger: !this.props.isModal
    })}>
      <div className='bookmarkForm' onClick={this.onClick}>
        <div {...props} />

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
                ? <Button l10nId='remove' className='whiteButton wideButton' onClick={this.onRemoveBookmark} />
                : null
              }
              <Button l10nId='done' disabled={!this.bookmarkNameValid} className='primaryButton wideButton' onClick={this.onSave} />
            </div>
          </div>
        </div>
        {
          !this.props.isModal
            ? <div className='bookmarkFormFooter'>
              <Button l10nId='viewBookmarks' onClick={this.onViewBookmarks} />
            </div>
            : null
        }
      </div>
    </div>
  }
}

module.exports = AddEditBookmarkHanger
