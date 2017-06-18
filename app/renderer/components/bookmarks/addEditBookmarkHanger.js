/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const BrowserButton = require('../common/browserButton')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Constants
const KeyCodes = require('../../../common/constants/keyCodes')
const siteTags = require('../../../../js/constants/siteTags')
const settings = require('../../../../js/constants/settings')

// Utils
const cx = require('../../../../js/lib/classSet')
const siteUtil = require('../../../../js/state/siteUtil')
const UrlUtil = require('../../../../js/lib/urlutil')
const {getSetting} = require('../../../../js/settings')
const {bookmarkHangerHeading, displayBookmarkName, isBookmarkNameValid} = require('../../../common/lib/bookmarkUtil')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const commonStyles = require('../styles/commonStyles')

const {
  CommonFormBookmarkHanger,
  CommonFormSection,
  CommonFormDropdown,
  CommonFormTextbox,
  CommonFormButtonWrapper,
  CommonFormBottomWrapper,
  commonFormStyles
} = require('../common/commonForm')

class AddEditBookmarkHanger extends React.Component {
  constructor (props) {
    super(props)
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

  setDefaultFocus () {
    this.bookmarkName.select()
    this.bookmarkName.focus()
  }

  componentDidMount () {
    // Automatically save if this is triggered by the url star
    if (!this.props.isModal && !this.props.shouldShowLocation) {
      this.onSave(false)
    }
    this.bookmarkName.value = displayBookmarkName(this.props.currentDetail)
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
      // '' is reserved for the default customTitle value of synced bookmarks,
      // so replace '' with 0 if the user is deleting the customTitle.
      // Note that non-string bookmark titles fail isBookmarkNameValid so they
      // are not saved.
      currentDetail = currentDetail.set('customTitle', name || 0)
    }
    if (this.bookmarkName.value !== name) {
      this.bookmarkName.value = name
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
    if (!this.props.hasBookmarks && !getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)) {
      appActions.changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
    }
  }

  onSave (closeDialog = true) {
    // First check if the title of the currentDetail is set
    if (!this.props.isBookmarkNameValid) {
      return false
    }
    this.showToolbarOnFirstBookmark()
    const tag = this.props.isFolder ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK
    appActions.addSite(this.props.currentDetail, tag, this.props.originalDetail, this.props.destinationDetail)

    if (closeDialog) {
      this.onClose()
    }
  }

  onRemoveBookmark () {
    const tag = this.props.isFolder ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK
    appActions.removeSite(this.props.currentDetail, tag)
    this.onClose()
  }

  onViewBookmarks () {
    this.onClose()
    appActions.createTabRequested({url: 'about:bookmarks'})
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const bookmarkDetail = currentWindow.get('bookmarkDetail', new Immutable.Map())
    const currentDetail = bookmarkDetail.get('currentDetail', new Immutable.Map())
    const originalDetail = bookmarkDetail.get('originalDetail')

    const props = {}
    // used in renderer
    props.isModal = ownProps.isModal
    props.withHomeButton = getSetting(settings.SHOW_HOME_BUTTON)
    // Fake a folderId property so that the bookmark is considered a bookmark folder.
    // This is ImmutableJS so it doesn't actually set a value, it just returns a new one.
    props.isFolder = siteUtil.isFolder(currentDetail.set('folderId', 0))
    props.shouldShowLocation = bookmarkDetail.get('shouldShowLocation')
    props.heading = bookmarkHangerHeading(originalDetail, props.isFolder, props.shouldShowLocation)
    props.location = currentDetail.get('location')
    props.parentFolderId = currentDetail.get('parentFolderId')
    props.hasOriginalDetail = !!originalDetail
    props.displayBookmarkName = displayBookmarkName(currentDetail)
    props.isBookmarkNameValid = isBookmarkNameValid(currentDetail, props.isFolder)
    props.folders = siteUtil.getFolders(state.get('sites'), currentDetail.get('folderId')) // TODO (nejc) improve, primitives only

    // used in functions
    props.currentDetail = currentDetail // TODO (nejc) improve, primitives only
    props.originalDetail = originalDetail // TODO (nejc) improve, primitives only
    props.destinationDetail = bookmarkDetail.get('destinationDetail') // TODO (nejc) improve, primitives only
    props.hasBookmarks = state.get('sites').find(
      (site) => siteUtil.isBookmark(site) || siteUtil.isFolder(site)
    )

    return props
  }

  render () {
    return <Dialog className={cx({
      bookmarkDialog: this.props.isModal,
      bookmarkHanger: !this.props.isModal,
      [css(styles.bookmarkHanger)]: !this.props.isModal
    })} onHide={this.onClose} isClickDismiss>
      <CommonFormBookmarkHanger onClick={this.onClick}>
        {
          !this.props.isModal
          ? <div className={cx({
            [css(styles.bookmarkHanger__arrowUp)]: true,
            [css(styles.bookmarkHanger__withHomeButton)]: this.props.withHomeButton
          })} />
          : null
        }
        <div className={cx({
          [css(styles.commonFormSection)]: true,
          [css(styles.commonFormTitle)]: true
        })} data-l10n-id={this.props.heading} />
        <CommonFormSection>
          <div className={css(styles.bookmark__sectionWrapper)}>
            <section>
              <label className={css(styles.bookmarkHanger__label)}
                data-l10n-id='nameField' htmlFor='bookmarkName' />
              <div className={css(
                commonFormStyles.inputWrapper,
                commonFormStyles.inputWrapper__input
              )}>
                <input className={css(
                  commonStyles.formControl,
                  commonStyles.textbox,
                  commonStyles.textbox__outlineable,
                  commonFormStyles.input__box,
                )}
                  data-test-id='bookmarkNameInput'
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onNameChange}
                  ref={(bookmarkName) => { this.bookmarkName = bookmarkName }}
                />
              </div>
            </section>
            {
              !this.props.isFolder && this.props.shouldShowLocation
              ? <section className={css(styles.bookmarkHanger__marginRow)}>
                <div className={css(
                  commonFormStyles.inputWrapper,
                  commonFormStyles.inputWrapper__input
                )}>
                  <label className={css(styles.bookmarkHanger__label)}
                    data-l10n-id='locationField' htmlFor='bookmarkLocation' />
                  <CommonFormTextbox
                    data-test-id='bookmarkLocationInput'
                    spellCheck='false'
                    onKeyDown={this.onKeyDown}
                    onChange={this.onLocationChange}
                    value={this.props.location}
                  />
                </div>
              </section>
              : null
            }
            <div className={css(
              commonFormStyles.inputWrapper,
              commonFormStyles.inputWrapper__input,
              styles.bookmarkHanger__marginRow,
            )}>
              <label className={css(styles.bookmarkHanger__label)}
                data-l10n-id='parentFolderField' htmlFor='bookmarkParentFolder' />
              <CommonFormDropdown
                data-test-id='bookmarkParentFolder'
                value={this.props.parentFolderId}
                onChange={this.onParentFolderChange} >
                <option value='0' data-l10n-id='bookmarksToolbar' />
                {
                  this.props.folders.map((folder) => <option value={folder.folderId}>{folder.label}</option>)
                }
              </CommonFormDropdown>
            </div>
          </div>
        </CommonFormSection>
        <CommonFormButtonWrapper>
          {
            this.props.hasOriginalDetail
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
            testId='bookmarkHangerDoneButton'
            disabled={!this.props.isBookmarkNameValid}
            onClick={this.onSave}
          />
        </CommonFormButtonWrapper>
        {
          !this.props.isModal
            ? <CommonFormBottomWrapper>
              <div className={css(styles.bookmark__bottomWrapper, styles.bottomWrapper__cursor)}
                data-test-id='viewBookmarks'
                data-l10n-id='viewBookmarks'
                onClick={this.onViewBookmarks} />
            </CommonFormBottomWrapper>
            : null
        }
      </CommonFormBookmarkHanger>
    </Dialog>
  }
}

const navigationButtonContainerWidth = globalStyles.navigationBar.navigationButtonContainer.width
const navigationButtonContainerMarginRight = globalStyles.navigationBar.navigationButtonContainer.marginRight
const bookmarkButtonContainerWidth = globalStyles.navigationBar.urlbarForm.height

// Add navigationButtonContainerMarginRight (6px)
const navigationButtonWidth = `calc(${navigationButtonContainerWidth} + ${navigationButtonContainerMarginRight})`

// Count the reload and stop button, adding the half width of the bookmark button container
// 12px == arrowUp width
const bookmarkHangerPosition = `calc(12px + ${navigationButtonWidth} + (${bookmarkButtonContainerWidth} / 2))`

// Add another container width
const bookmarkHangerPositionWithHomeButton = `calc(${bookmarkHangerPosition} + ${navigationButtonWidth})`

const styles = StyleSheet.create({
  // Copied from commonForm.js
  commonFormSection: {
    // PR #7985
    margin: `${globalStyles.spacing.dialogInsideMargin} 30px`
  },
  commonFormTitle: {
    color: globalStyles.color.braveOrange,
    fontSize: '1.2em'
  },

  bookmarkHanger: {
    // See: #9040
    justifyContent: 'flex-start !important',
    background: 'none !important',

    // TODO: refactor navigationBar.less to remove !important
    animation: 'none !important',
    zIndex: `${globalStyles.zindex.zindexDialogs} !important`,

    ':focus': {
      outline: 'none'
    }
  },
  bookmarkHanger__arrowUp: {
    position: 'relative',
    left: bookmarkHangerPosition,

    '::after': {
      content: '""',
      position: 'absolute',
      width: 0,
      height: 0,
      border: `8px solid ${globalStyles.color.commonFormBackgroundColor}`,
      boxShadow: globalStyles.shadow.bookmarkHangerArrowUpShadow,
      transformOrigin: '0 0',
      transform: 'rotate(135deg)'
    }
  },
  bookmarkHanger__withHomeButton: {
    left: bookmarkHangerPositionWithHomeButton
  },
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
  },
  bookmark__bottomWrapper: {
    display: 'flex',
    justifyContent: 'center'
  },
  bottomWrapper__cursor: {
    cursor: 'pointer'
  }
})

module.exports = ReduxComponent.connect(AddEditBookmarkHanger)
