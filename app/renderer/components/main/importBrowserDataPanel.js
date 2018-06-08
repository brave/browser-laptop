/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const Button = require('../common/button')
const SwitchControl = require('../common/switchControl')
const {
  CommonForm,
  CommonFormDropdown,
  CommonFormSection,
  CommonFormTitle,
  CommonFormButtonWrapper,
  CommonFormBottomWrapper
} = require('../common/commonForm')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Styles
const globalStyles = require('../styles/global')

class ImportBrowserDataPanel extends React.Component {
  constructor (props) {
    super(props)
    this.onToggleHistory = this.onToggleSetting.bind(this, 'history')
    this.onToggleFavorites = this.onToggleSetting.bind(this, 'favorites')
    this.onToggleCookies = this.onToggleSetting.bind(this, 'cookies')
    this.onTogglePasswords = this.onToggleSetting.bind(this, 'passwords')
    this.onImport = this.onImport.bind(this)
    this.onChange = this.onChange.bind(this)
  }

  onToggleSetting (setting, e) {
    windowActions.setImportBrowserDataSelected({
      [setting]: e.target.value
    })
  }

  onImport () {
    let data = {}
    data.index = this.props.selectedIndex.toString()
    data.cookies = this.props.cookies
    data.favorites = this.props.favorites
    data.history = this.props.history
    data.type = this.props.type
    data.passwords = this.props.passwords

    appActions.importBrowserData(Immutable.fromJS(data))
    this.onHide()
  }

  onChange (e) {
    windowActions.setImportBrowserDataSelected(~~e.target.value)
  }

  onHide () {
    windowActions.setImportBrowserDataDetail()
  }

  componentWillMount () {
    if (this.props.selectedIndex == null) {
      windowActions.setImportBrowserDataSelected(0)
    }
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const importBrowserDataSelected = currentWindow.get('importBrowserDataSelected', Immutable.Map())
    const importBrowserDataDetail = currentWindow.get('importBrowserDataDetail', Immutable.Map())
    const index = importBrowserDataSelected.get('index', '0')
    const currentSelectedBrowser = importBrowserDataDetail.get(index, Immutable.Map())

    const props = {}
    // used in renderer
    props.browserNames = importBrowserDataDetail.map((browser) => browser.get('name'))
    props.browserIndexes = importBrowserDataDetail.map((browser) => browser.get('index'))
    props.isSupportingHistory = currentSelectedBrowser.get('history', false)
    props.isSupportingFavorites = currentSelectedBrowser.get('favorites', false)
    props.isSupportingCookies = currentSelectedBrowser.get('cookies', false)
    props.isSupportingPasswords = currentSelectedBrowser.get('passwords', false)
    props.currentIndex = index
    props.cookies = importBrowserDataSelected.get('cookies')
    props.favorites = importBrowserDataSelected.get('favorites')
    props.history = importBrowserDataSelected.get('history')
    props.type = importBrowserDataSelected.get('type')
    props.passwords = importBrowserDataSelected.get('passwords')

    // used in other functions
    props.selectedIndex = importBrowserDataSelected.get('index')

    return props
  }

  render () {
    return <Dialog onHide={this.onHide} testId='importBrowserDataPanel' isClickDismiss>
      <CommonForm data-test-id='importBrowserData' onClick={(e) => e.stopPropagation()}>
        <CommonFormTitle
          data-test-id='importBrowserDataTitle'
          data-l10n-id='importBrowserData'
        />
        <CommonFormSection data-test-id='importBrowserDataOptions'>
          <div className={css(styles.dropdownWrapper)}>
            <CommonFormDropdown
              value={this.props.currentIndex}
              onChange={this.onChange} >
              {
                this.props.browserNames.map((name, i) => {
                  return <option value={this.props.browserIndexes.get(i)}>{name}</option>
                })
              }
            </CommonFormDropdown>
          </div>
          <SwitchControl
            rightl10nId='browserHistory'
            checkedOn={this.props.history}
            onClick={this.onToggleHistory}
            disabled={!this.props.isSupportingHistory}
          />
          <SwitchControl
            rightl10nId='favoritesOrBookmarks'
            checkedOn={this.props.favorites}
            onClick={this.onToggleFavorites}
            disabled={!this.props.isSupportingFavorites}
          />
          <SwitchControl
            rightl10nId='cookies'
            checkedOn={this.props.cookies}
            onClick={this.onToggleCookies}
            disabled={!this.props.isSupportingCookies}
          />
          <SwitchControl
            rightl10nId='savedPasswords'
            checkedOn={this.props.passwords}
            onClick={this.onTogglePasswords}
            disabled={!this.props.isSupportingPasswords}
          />

        </CommonFormSection>
        <CommonFormSection>
          <div data-l10n-id='importDataCloseBrowserWarning' />
        </CommonFormSection>
        <CommonFormButtonWrapper data-test-id='importBrowserDataButtons'>
          <Button l10nId='cancel' className='whiteButton' onClick={this.onHide} />
          <Button l10nId='import' className='primaryButton' onClick={this.onImport} />
        </CommonFormButtonWrapper>
        <CommonFormBottomWrapper data-test-id='importBrowserDataWarning'>
          <div data-l10n-id='importDataWarning' />
        </CommonFormBottomWrapper>
      </CommonForm>
    </Dialog>
  }
}

module.exports = ReduxComponent.connect(ImportBrowserDataPanel)

const styles = StyleSheet.create({
  dropdownWrapper: {
    marginBottom: `calc(${globalStyles.spacing.dialogInsideMargin} / 2)`
  }
})
