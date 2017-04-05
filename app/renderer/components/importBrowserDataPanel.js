/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const Dialog = require('../../../js/components/dialog')
const Button = require('../../../js/components/button')
const SwitchControl = require('../../../js/components/switchControl')
const windowActions = require('../../../js/actions/windowActions')
const appActions = require('../../../js/actions/appActions')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('./styles/global')

const {
  CommonForm,
  CommonFormDropdown,
  CommonFormSection,
  CommonFormTitle,
  CommonFormSubSection,
  CommonFormButtonWrapper,
  CommonFormBottomWrapper
} = require('./commonForm')

class ImportBrowserDataPanel extends ImmutableComponent {
  constructor () {
    super()
    this.onToggleHistory = this.onToggleSetting.bind(this, 'history')
    this.onToggleFavorites = this.onToggleSetting.bind(this, 'favorites')
    this.onToggleMergeFavorites = this.onToggleSetting.bind(this, 'mergeFavorites')
    this.onToggleCookies = this.onToggleSetting.bind(this, 'cookies')
    this.onImport = this.onImport.bind(this)
    this.onChange = this.onChange.bind(this)
  }
  onToggleSetting (setting, e) {
    if (setting === 'favorites') {
      this.props.importBrowserDataSelected =
        this.props.importBrowserDataSelected.set('mergeFavorites', e.target.value)
    }
    windowActions.setImportBrowserDataSelected(this.props.importBrowserDataSelected.set(setting, e.target.value))
  }
  get browserData () {
    let index = this.props.importBrowserDataSelected.get('index')
    if (index === undefined) {
      index = '0'
    }
    return this.props.importBrowserDataDetail.get(index)
  }
  get supportHistory () {
    let browserData = this.browserData
    if (browserData === undefined) {
      return false
    }
    return browserData.get('history')
  }
  get supportFavorites () {
    let browserData = this.browserData
    if (browserData === undefined) {
      return false
    }
    return browserData.get('favorites')
  }
  get supportCookies () {
    let browserData = this.browserData
    if (browserData === undefined) {
      return false
    }
    return browserData.get('cookies')
  }
  onImport () {
    let index = this.props.importBrowserDataSelected.get('index')
    if (index === undefined) {
      this.props.importBrowserDataSelected = this.props.importBrowserDataSelected.set('index', '0')
    }
    let browserData = this.browserData
    if (browserData !== undefined) {
      let type = browserData.get('type')
      this.props.importBrowserDataSelected = this.props.importBrowserDataSelected.set('type', type)
    }
    appActions.importBrowserData(this.props.importBrowserDataSelected)
    this.props.onHide()
  }
  onChange (e) {
    this.props.importBrowserDataSelected = this.props.importBrowserDataSelected.set('index', e.target.value)
    this.props.importBrowserDataSelected = this.props.importBrowserDataSelected.set('history', false)
    this.props.importBrowserDataSelected = this.props.importBrowserDataSelected.set('favorites', false)
    this.props.importBrowserDataSelected = this.props.importBrowserDataSelected.set('mergeFavorites', false)
    this.props.importBrowserDataSelected = this.props.importBrowserDataSelected.set('cookies', false)
    let importBrowserDataSelected = this.props.importBrowserDataSelected
    if (this.supportHistory) {
      importBrowserDataSelected = importBrowserDataSelected.set('history', true)
    }
    if (this.supportFavorites) {
      importBrowserDataSelected = importBrowserDataSelected.set('favorites', true)
      importBrowserDataSelected = importBrowserDataSelected.set('mergeFavorites', true)
    }
    if (this.supportCookies) {
      importBrowserDataSelected = importBrowserDataSelected.set('cookies', true)
    }
    windowActions.setImportBrowserDataSelected(importBrowserDataSelected)
  }
  get selectedBrowser () {
    let index = this.props.importBrowserDataSelected.get('index')
    if (index === undefined) {
      this.props.importBrowserDataSelected = this.props.importBrowserDataSelected.set('index', '0')
      if (this.supportHistory) {
        this.props.importBrowserDataSelected = this.props.importBrowserDataSelected.set('history', true)
      }
      if (this.supportFavorites) {
        this.props.importBrowserDataSelected = this.props.importBrowserDataSelected.set('favorites', true)
        this.props.importBrowserDataSelected = this.props.importBrowserDataSelected.set('mergeFavorites', true)
      }
      if (this.supportCookies) {
        this.props.importBrowserDataSelected = this.props.importBrowserDataSelected.set('cookies', true)
      }
    }
    return index !== undefined ? index : '0'
  }
  render () {
    var browsers = []
    if (this.props.importBrowserDataDetail !== undefined) {
      this.props.importBrowserDataDetail.toJS().forEach((browser) => {
        browsers.push(<option value={browser.index}>{browser.name}</option>)
      })
    }
    return <Dialog onHide={this.props.onHide} data-test-id='importBrowserDataPanel' isClickDismiss>
      <CommonForm data-test-id='importBrowserData' onClick={(e) => e.stopPropagation()}>
        <CommonFormTitle
          data-test-id='importBrowserDataTitle'
          data-l10n-id='importBrowserData'
        />
        <CommonFormSection data-test-id='importBrowserDataOptions'>
          <div className={css(styles.dropdownWrapper)}>
            <CommonFormDropdown
              value={this.selectedBrowser}
              onChange={this.onChange} >
              {browsers}
            </CommonFormDropdown>
          </div>
          <SwitchControl
            rightl10nId='browserHistory'
            checkedOn={this.props.importBrowserDataSelected.get('history')}
            onClick={this.onToggleHistory}
            disabled={!this.supportHistory}
          />
          <SwitchControl
            rightl10nId='favoritesOrBookmarks'
            checkedOn={this.props.importBrowserDataSelected.get('favorites')}
            onClick={this.onToggleFavorites}
            disabled={!this.supportFavorites}
          />
          <CommonFormSubSection data-test-id='importBrowserSubDataOptions'>
            <SwitchControl
              rightl10nId='mergeIntoBookmarksToolbar'
              checkedOn={this.props.importBrowserDataSelected.get('mergeFavorites')}
              onClick={this.onToggleMergeFavorites}
              disabled={!this.props.importBrowserDataSelected.get('favorites')}
            />
          </CommonFormSubSection>
          <SwitchControl
            rightl10nId='cookies'
            checkedOn={this.props.importBrowserDataSelected.get('cookies')}
            onClick={this.onToggleCookies}
            disabled={!this.supportCookies}
          />
        </CommonFormSection>
        <CommonFormSection>
          <div data-l10n-id='importDataCloseBrowserWarning' />
        </CommonFormSection>
        <CommonFormButtonWrapper data-test-id='importBrowserDataButtons'>
          <Button l10nId='cancel' className='whiteButton' onClick={this.props.onHide} />
          <Button l10nId='import' className='primaryButton' onClick={this.onImport} />
        </CommonFormButtonWrapper>
        <CommonFormBottomWrapper data-test-id='importBrowserDataWarning'>
          <div data-l10n-id='importDataWarning' />
        </CommonFormBottomWrapper>
      </CommonForm>
    </Dialog>
  }
}

const styles = StyleSheet.create({
  dropdownWrapper: {
    marginBottom: `calc(${globalStyles.spacing.dialogInsideMargin} / 2)`
  }
})

module.exports = ImportBrowserDataPanel
