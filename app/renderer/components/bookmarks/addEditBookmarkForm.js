/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const BrowserButton = require('../common/browserButton')
const {
  CommonFormSection,
  CommonFormDropdown,
  CommonFormTextbox,
  CommonFormButtonWrapper,
  commonFormStyles
} = require('../common/commonForm')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Constants
const KeyCodes = require('../../../common/constants/keyCodes')
const settings = require('../../../../js/constants/settings')

// Utils
const UrlUtil = require('../../../../js/lib/urlutil')
const {getSetting} = require('../../../../js/settings')
const {isBookmarkNameValid} = require('../../../common/lib/bookmarkUtil')
const contextMenus = require('../../../../js/contextMenus')

// Styles
const globalStyles = require('../styles/global')
const commonStyles = require('../styles/commonStyles')

class AddEditBookmarkForm extends React.Component {
  constructor (props) {
    super(props)
    this.onNameChange = this.onNameChange.bind(this)
    this.onLocationChange = this.onLocationChange.bind(this)
    this.onParentFolderChange = this.onParentFolderChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onClose = this.onClose.bind(this)
    this.onSave = this.onSave.bind(this)
    this.onRemoveBookmark = this.onRemoveBookmark.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.state = {
      title: props.title,
      location: props.location,
      parentFolderId: props.parentFolderId,
      isDisabled: props.isDisabled
    }
  }

  componentDidMount () {
    setImmediate(() => {
      this.bookmarkName.select()
    })
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

  onContextMenu (e) {
    contextMenus.onEditBookmarkContextMenu(e)
  }

  onClose () {
    windowActions.onBookmarkClose()
  }

  updateButtonStatus (newValue) {
    if (newValue !== this.state.isDisabled) {
      this.setState({
        isDisabled: newValue
      })
    }
  }

  onNameChange (e) {
    let title = e.target.value

    this.setState({
      title: title
    })
  }

  onLocationChange (e) {
    let location = e.target.value

    this.setState({
      location: location
    })

    this.updateButtonStatus(!isBookmarkNameValid(location))
  }

  onParentFolderChange (e) {
    this.setState({
      parentFolderId: Number(e.target.value)
    })
  }

  onSave () {
    // First check if the title of the bookmarkDetail is set
    if (this.state.isDisabled) {
      return false
    }

    // show bookmark if hidden
    if (!this.props.hasBookmarks && !getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)) {
      appActions.changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
    }

    let data = Immutable.fromJS({
      parentFolderId: this.state.parentFolderId
    })

    // handle title input
    let title = this.state.title
    if (typeof title === 'string' && UrlUtil.isURL(title)) {
      const punycodeUrl = UrlUtil.getPunycodeUrl(title)
      if (punycodeUrl.replace(/\/$/, '') !== title) {
        title = punycodeUrl
      }
    }
    data = data.set('title', title)

    // handle location input
    let location = this.state.location
    if (typeof location === 'string') {
      const punycodeUrl = UrlUtil.getPunycodeUrl(location)
      if (punycodeUrl.replace(/\/$/, '') !== location) {
        location = punycodeUrl
      }
    }
    data = data.set('location', location)

    if (this.props.editKey != null) {
      appActions.editBookmark(this.props.editKey, data)
    } else {
      appActions.addBookmark(data, this.props.closestKey)
    }

    this.onClose()
  }

  onRemoveBookmark () {
    appActions.removeBookmark(this.props.editKey)
    this.onClose()
  }

  render () {
    return <div>
      <CommonFormSection>
        <div className={css(styles.bookmark__sectionWrapper)}>
          <section>
            <label
              className={css(styles.bookmarkHanger__label)}
              data-l10n-id='nameField'
              htmlFor='bookmarkName'
            />
            <div className={css(
              commonFormStyles.inputWrapper,
              commonFormStyles.inputWrapper__input
            )}>
              <input
                className={css(
                  commonStyles.formControl,
                  commonStyles.textbox,
                  commonStyles.textbox__outlineable,
                  commonFormStyles.input__box
                )}
                onContextMenu={this.onContextMenu}
                data-test-id='bookmarkNameInput'
                spellCheck='false'
                onKeyDown={this.onKeyDown}
                onChange={this.onNameChange}
                defaultValue={this.state.title}
                ref={(bookmarkName) => { this.bookmarkName = bookmarkName }}
              />
            </div>
          </section>
          {
            !this.props.isAdded
              ? <section className={css(styles.bookmarkHanger__marginRow)}>
                <div className={css(
                  commonFormStyles.inputWrapper,
                  commonFormStyles.inputWrapper__input
                )}>
                  <label
                    className={css(styles.bookmarkHanger__label)}
                    data-l10n-id='locationField'
                    htmlFor='bookmarkLocation'
                  />
                  <CommonFormTextbox
                    onContextMenu={this.onContextMenu}
                    data-test-id='bookmarkLocationInput'
                    spellCheck='false'
                    onKeyDown={this.onKeyDown}
                    onChange={this.onLocationChange}
                    defaultValue={this.state.location}
                  />
                </div>
              </section>
              : null
          }
          <div className={css(
            commonFormStyles.inputWrapper,
            commonFormStyles.inputWrapper__input,
            styles.bookmarkHanger__marginRow
          )}>
            <label
              className={css(styles.bookmarkHanger__label)}
              data-l10n-id='parentFolderField'
              htmlFor='bookmarkParentFolder'
            />
            <CommonFormDropdown
              data-test-id='bookmarkParentFolder'
              defaultValue={this.state.parentFolderId}
              onChange={this.onParentFolderChange} >
              <option value='0' data-l10n-id='bookmarksToolbar' />
              <option value='-1' data-l10n-id='otherBookmarks' />
              {
                this.props.folders.map((folder) => <option value={folder.folderId}>{folder.label}</option>)
              }
            </CommonFormDropdown>
          </div>
        </div>
      </CommonFormSection>
      <CommonFormButtonWrapper>
        {
          this.props.editKey != null
            ? <BrowserButton groupedItem secondaryColor
              l10nId='remove'
              testId='bookmarkHangerRemoveButton'
              onClick={this.onRemoveBookmark}
            />
            : <BrowserButton groupedItem secondaryColor
              l10nId='cancel'
              testId='bookmarkHangerCancelButton'
              onClick={this.onClose}
            />
        }
        <BrowserButton groupedItem primaryColor
          l10nId='done'
          testId={!this.state.isDisabled ? 'bookmarkHangerDoneButton' : 'bookmarkHangerDoneButtonDisabled'}
          disabled={this.state.isDisabled}
          onClick={this.onSave}
        />
      </CommonFormButtonWrapper>
    </div>
  }
}

const styles = StyleSheet.create({
  bookmarkHanger__label: {
    display: 'block',
    marginBottom: `calc(${globalStyles.spacing.dialogInsideMargin} / 3)`
  },
  bookmarkHanger__marginRow: {
    marginTop: `calc(${globalStyles.spacing.dialogInsideMargin} / 2)`
  },

  bookmark__sectionWrapper: {
    display: 'flex',
    flexFlow: 'column nowrap'
  }
})

module.exports = AddEditBookmarkForm
