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

class AddEditBookmark extends ImmutableComponent {
  constructor () {
    super()
    this.onNameChange = this.onNameChange.bind(this)
    this.onLocationChange = this.onLocationChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onClose = this.onClose.bind(this)
  }
  get isBlankTab () {
    return ['about:blank', 'about:newtab'].includes(this.props.currentDetail.get('location'))
  }
  get isFolder () {
    return this.props.currentDetail.get('tags').includes(siteTags.BOOKMARK_FOLDER)
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
    const currentDetail = this.props.currentDetail.set('title', e.target.value)
    windowActions.setBookmarkDetail(currentDetail, this.props.originalDetail)
  }
  onLocationChange (e) {
    const currentDetail = this.props.currentDetail.set('location', e.target.value)
    windowActions.setBookmarkDetail(currentDetail, this.props.originalDetail)
  }
  onSave () {
    const tag = this.isFolder ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK
    appActions.addSite(this.props.currentDetail, tag, this.props.originalDetail)
    this.onClose()
  }
  render () {
    return <Dialog onHide={this.onClose} isClickDismiss>
      <div className='addEditBookmark' onClick={this.onClick.bind(this)}>
        <div id='bookmarkName' className='bookmarkFormRow'>
          <label data-l10n-id='nameField' htmlFor='bookmarkName'/>
          <input onKeyDown={this.onKeyDown} onChange={this.onNameChange} value={this.props.currentDetail.get('title')} ref={bookmarkName => this.bookmarkName = bookmarkName }/>
        </div>
        { !this.isFolder
          ? <div id='bookmarkLocation' className='bookmarkFormRow'>
          <label data-l10n-id='locationField' htmlFor='bookmarkLocation'/>
          <input onKeyDown={this.onKeyDown} onChange={this.onLocationChange} value={this.props.currentDetail.get('location')} />
        </div> : null }
        <div className='bookmarkFormRow'>
          <span/>
          <Button l10nId='save' className='primaryButton' onClick={this.onSave.bind(this)}/>
        </div>
      </div>
    </Dialog>
  }
}

module.exports = AddEditBookmark
