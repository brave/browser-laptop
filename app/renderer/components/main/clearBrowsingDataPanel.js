/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const Button = require('../common/button')
const SwitchControl = require('../common/switchControl')
const {
  CommonFormSmall,
  CommonFormSection,
  CommonFormTitle,
  CommonFormButtonWrapper,
  CommonFormBottomWrapper
} = require('../common/commonForm')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')
const aboutActions = require('../../../../js/about/aboutActions')

// State
const ledgerState = require('../../../common/state/ledgerState')

// Constants
const ledgerStatuses = require('../../../common/constants/ledgerStatuses')

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
    this.onTogglePublishersClear = this.onToggleSetting.bind(this, 'publishersClear')
    this.onTogglePaymentHistory = this.onToggleSetting.bind(this, 'paymentHistory')
    this.onToggleAdsSettings = this.onToggleSetting.bind(this, 'adsSettings')
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
    props.inProgress = ledgerState.getAboutProp(state, 'status') === ledgerStatuses.IN_PROGRESS
    props.allSiteCookies = data.get('allSiteCookies')
    props.browserHistory = data.get('browserHistory')
    props.downloadHistory = data.get('downloadHistory')
    props.cachedImagesAndFiles = data.get('cachedImagesAndFiles')
    props.savedPasswords = data.get('savedPasswords')
    props.allSiteCookies = data.get('allSiteCookies')
    props.autocompleteData = data.get('autocompleteData')
    props.autofillData = data.get('autofillData')
    props.savedSiteSettings = data.get('savedSiteSettings')
    props.publishersClear = props.inProgress ? false : data.get('publishersClear')
    props.paymentHistory = props.inProgress ? false : data.get('paymentHistory')
    props.adsSettings = data.get('adsSettings')

    return props
  }

  render () {
    return <Dialog onHide={this.onHide} testId='clearBrowsingDataPanel' isClickDismiss>
      <CommonFormSmall onClick={(e) => e.stopPropagation()}>
        <CommonFormTitle data-l10n-id='clearBrowsingData' />
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
          <SwitchControl
            rightl10nId='Brave ads'
            testId='adsSettingsSwitch'
            checkedOn={this.props.adsSettings}
            onClick={this.onToggleAdsSettings} />
          <SwitchControl
            rightl10nId='publishersClear'
            testId='publishersClear'
            disabled={this.props.inProgress}
            checkedOn={this.props.publishersClear}
            onClick={this.onTogglePublishersClear} />
          <SwitchControl
            rightl10nId='paymentHistory'
            testId='paymentHistorySwitch'
            disabled={this.props.inProgress}
            checkedOn={this.props.paymentHistory}
            onClick={this.onTogglePaymentHistory} />
          {
            this.props.inProgress
            ? <span data-l10n-id='confirmPaymentsClear' className={css(styles.footNote)} />
            : null
          }
        </CommonFormSection>
        <CommonFormButtonWrapper>
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
        </CommonFormButtonWrapper>
        <CommonFormBottomWrapper>
          <div data-l10n-id='clearDataWarning' />
        </CommonFormBottomWrapper>
      </CommonFormSmall>
    </Dialog>
  }
}

const styles = StyleSheet.create({
  footNote: {
    marginTop: '12px',
    fontSize: '12px',
    display: 'block'
  }
})

module.exports = ReduxComponent.connect(ClearBrowsingDataPanel)
