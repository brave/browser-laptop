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

// Utils
const {getCurrentWindowId} = require('../../currentWindow')

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
    this.onHide = this.onHide.bind(this)
  }

  onToggleSetting (setting, e) {
    appActions.setImportBrowserDataSelected(this.props.windowId, {
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

    appActions.setImportBrowserDataDetail(this.props.windowId, {
      loading: true
    })
    appActions.importBrowserData(Immutable.fromJS(data))
  }

  onChange (e) {
    appActions.setImportBrowserDataSelected(this.props.windowId, ~~e.target.value)
  }

  onHide () {
    appActions.setImportBrowserDataDetail(this.props.windowId)
  }

  componentWillMount () {
    if (this.props.selectedIndex == null) {
      appActions.setImportBrowserDataSelected(this.props.windowId, 0)
    }
  }

  mergeProps (state, ownProps) {
    const windowId = getCurrentWindowId()
    const importBrowserDataSelected = state.getIn(['windows', windowId, 'importBrowserDataSelected'], Immutable.Map())
    const importBrowserDataDetail = state.getIn(['windows', windowId, 'importBrowserDataDetail'], Immutable.Map())
    const browsers = importBrowserDataDetail.get('browsers', Immutable.Map())
    const index = importBrowserDataSelected.get('index', '0')
    const currentSelectedBrowser = browsers.get(index, Immutable.Map())

    const props = {}
    // used in renderer
    props.browserNames = browsers.map((browser) => browser.get('name'))
    props.browserIndexes = browsers.map((browser) => browser.get('index'))
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
    props.isLoading = importBrowserDataDetail.get('loading', false)

    // used in other functions
    props.selectedIndex = importBrowserDataSelected.get('index')
    props.windowId = windowId

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
              disabled={this.props.isLoading}
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
          <Button
            l10nId='cancel'
            className='whiteButton'
            onClick={this.onHide}
            disabled={this.props.isLoading}
          />
          <Button
            l10nId='import'
            className='primaryButton'
            onClick={this.onImport}
            disabled={this.props.isLoading}
          />
        </CommonFormButtonWrapper>
        {
          this.props.isLoading
          ? <CommonFormBottomWrapper data-test-id='importDataLoading'>
            <div data-l10n-id='importDataLoading' />
          </CommonFormBottomWrapper>
          : <CommonFormBottomWrapper data-test-id='importBrowserDataWarning'>
            <div data-l10n-id='importDataWarning' />
          </CommonFormBottomWrapper>
        }
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
