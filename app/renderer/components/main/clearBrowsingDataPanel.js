/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const Button = require('../common/button')
const SwitchControl = require('../common/switchControl')
const {
  CommonForm,
  CommonFormSection
} = require('../common/commonForm')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')
const aboutActions = require('../../../../js/about/aboutActions')

class ClearBrowsingDataPanel extends React.Component {
  constructor (props) {
    super(props)
    this.onToggleBrowserHistory = this.onToggleSetting.bind(this, 'browserHistory')
    this.onToggleDownloadHistory = this.onToggleSetting.bind(this, 'downloadHistory')
    this.onToggleCachedImagesAndFiles = this.onToggleSetting.bind(this, 'cachedImagesAndFiles')
    this.onToggleSavedPasswords = this.onToggleSetting.bind(this, 'savedPasswords')
    this.onToggleAllSiteCookies = this.onToggleSetting.bind(this, 'allSiteCookies')
    this.onToggleAutocompleteData = this.onToggleSetting.bind(this, 'autocompleteData')
    this.onToggleAutofillData = this.onToggleSetting.bind(this, 'autofillData')
    this.onToggleSavedSiteSettings = this.onToggleSetting.bind(this, 'savedSiteSettings')
    this.onClear = this.onClear.bind(this)
    this.onCancel = this.onCancel.bind(this)
  }

  onToggleSetting (setting, e) {
    appActions.onToggleBrowsingData(setting, e.target.value)
  }

  onClear () {
    appActions.onClearBrowsingData()
    this.onHide()

    if (
      this.props.allSiteCookies &&
      this.props.browserHistory &&
      this.props.cachedImagesAndFiles
    ) {
      aboutActions.requireRestart()
    }
  }

  onCancel () {
    appActions.onCancelBrowsingData()
    this.onHide()
  }

  onHide () {
    windowActions.setClearBrowsingDataPanelVisible(false)
  }

  mergeProps (state, ownProps) {
    const tempData = state.get('tempClearBrowsingData', Immutable.Map())
    const data = state.get('clearBrowsingDataDefaults', Immutable.Map()).merge(tempData)

    const props = {}
    props.allSiteCookies = data.get('allSiteCookies')
    props.browserHistory = data.get('browserHistory')
    props.downloadHistory = data.get('downloadHistory')
    props.cachedImagesAndFiles = data.get('cachedImagesAndFiles')
    props.savedPasswords = data.get('savedPasswords')
    props.allSiteCookies = data.get('allSiteCookies')
    props.autocompleteData = data.get('autocompleteData')
    props.autofillData = data.get('autofillData')
    props.savedSiteSettings = data.get('savedSiteSettings')

    return props
  }

  render () {
    return <Dialog onHide={this.onHide} testId='clearBrowsingDataPanel' isClickDismiss>
      <CommonForm small onClick={(e) => e.stopPropagation()}>
        <CommonFormSection title l10nId='clearBrowsingData' />
        <CommonFormSection>
          <SwitchControl
            rightl10nId='browserHistory'
            testId='browserHistorySwitch'
            checkedOn={this.props.browserHistory}
            onClick={this.onToggleBrowserHistory} />
          <SwitchControl
            rightl10nId='downloadHistory'
            checkedOn={this.props.downloadHistory}
            onClick={this.onToggleDownloadHistory} />
          <SwitchControl
            rightl10nId='cachedImagesAndFiles'
            checkedOn={this.props.cachedImagesAndFiles}
            onClick={this.onToggleCachedImagesAndFiles} />
          <SwitchControl
            rightl10nId='savedPasswords'
            checkedOn={this.props.savedPasswords}
            onClick={this.onToggleSavedPasswords} />
          <SwitchControl
            rightl10nId='allSiteCookies'
            checkedOn={this.props.allSiteCookies}
            onClick={this.onToggleAllSiteCookies} />
          <SwitchControl
            rightl10nId='autocompleteData'
            testId='autocompleteDataSwitch'
            checkedOn={this.props.autocompleteData}
            onClick={this.onToggleAutocompleteData} />
          <SwitchControl
            rightl10nId='autofillData'
            testId='autofillDataSwitch'
            checkedOn={this.props.autofillData}
            onClick={this.onToggleAutofillData} />
          <SwitchControl
            rightl10nId='savedSiteSettings'
            testId='siteSettingsSwitch'
            checkedOn={this.props.savedSiteSettings}
            onClick={this.onToggleSavedSiteSettings} />
        </CommonFormSection>
        <CommonFormSection buttons>
          <Button className='whiteButton'
            l10nId='cancel'
            testId='cancelButton'
            onClick={this.onCancel}
          />
          <Button className='primaryButton'
            l10nId='clear'
            testId='clearDataButton'
            onClick={this.onClear}
          />
        </CommonFormSection>
        <CommonFormSection bottom>
          <div data-l10n-id='clearDataWarning' />
        </CommonFormSection>
      </CommonForm>
    </Dialog>
  }
}

module.exports = ReduxComponent.connect(ClearBrowsingDataPanel)
