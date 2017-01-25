/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const Dialog = require('./dialog')
const Button = require('./button')
const SwitchControl = require('./switchControl')
const appActions = require('../actions/appActions')
const ipc = require('electron').ipcRenderer
const messages = require('../constants/messages')

class ClearBrowsingDataPanel extends React.Component {
  constructor (props) {
    super()
    this.onToggleBrowserHistory = this.onToggleSetting.bind(this, 'browserHistory')
    this.onToggleDownloadHistory = this.onToggleSetting.bind(this, 'downloadHistory')
    this.onToggleCachedImagesAndFiles = this.onToggleSetting.bind(this, 'cachedImagesAndFiles')
    this.onToggleSavedPasswords = this.onToggleSetting.bind(this, 'savedPasswords')
    this.onToggleAllSiteCookies = this.onToggleSetting.bind(this, 'allSiteCookies')
    this.onToggleAutocompleteData = this.onToggleSetting.bind(this, 'autocompleteData')
    this.onToggleAutofillData = this.onToggleSetting.bind(this, 'autofillData')
    this.onToggleSavedSiteSettings = this.onToggleSetting.bind(this, 'savedSiteSettings')
    this.onClear = this.onClear.bind(this)
    this.state = {
      clearBrowsingDataDetail: props.clearBrowsingDataDefaults ? props.clearBrowsingDataDefaults : Immutable.Map()
    }
  }
  onToggleSetting (setting) {
    this.setState(({clearBrowsingDataDetail}) => ({
      clearBrowsingDataDetail: clearBrowsingDataDetail.update(setting, isChecked => !isChecked)
    }))
  }
  onClear () {
    appActions.onClearBrowsingData(this.state.clearBrowsingDataDetail)
    this.props.onHide()
    let detail = this.state.clearBrowsingDataDetail
    if (detail.get('allSiteCookies') && detail.get('browserHistory') &&
        detail.get('cachedImagesAndFiles')) {
      ipc.send(messages.PREFS_RESTART)
    }
  }
  render () {
    return <Dialog onHide={this.props.onHide} className='clearBrowsingDataPanel' isClickDismiss>
      <div className='clearBrowsingData' onClick={(e) => e.stopPropagation()}>
        <div className='formSection clearBrowsingDataTitle' data-l10n-id='clearBrowsingData' />
        <div className='formSection clearBrowsingDataOptions'>
          <SwitchControl className='browserHistorySwitch' rightl10nId='browserHistory' checkedOn={this.state.clearBrowsingDataDetail.get('browserHistory')} onClick={this.onToggleBrowserHistory} />
          <SwitchControl rightl10nId='downloadHistory' checkedOn={this.state.clearBrowsingDataDetail.get('downloadHistory')} onClick={this.onToggleDownloadHistory} />
          <SwitchControl rightl10nId='cachedImagesAndFiles' checkedOn={this.state.clearBrowsingDataDetail.get('cachedImagesAndFiles')} onClick={this.onToggleCachedImagesAndFiles} />
          <SwitchControl rightl10nId='savedPasswords' checkedOn={this.state.clearBrowsingDataDetail.get('savedPasswords')} onClick={this.onToggleSavedPasswords} />
          <SwitchControl rightl10nId='allSiteCookies' checkedOn={this.state.clearBrowsingDataDetail.get('allSiteCookies')} onClick={this.onToggleAllSiteCookies} />
          <SwitchControl className='autocompleteDataSwitch' rightl10nId='autocompleteData' checkedOn={this.state.clearBrowsingDataDetail.get('autocompleteData')} onClick={this.onToggleAutocompleteData} />
          <SwitchControl className='autofillDataSwitch' rightl10nId='autofillData' checkedOn={this.state.clearBrowsingDataDetail.get('autofillData')} onClick={this.onToggleAutofillData} />
          <SwitchControl className='siteSettingsSwitch' rightl10nId='savedSiteSettings' checkedOn={this.state.clearBrowsingDataDetail.get('savedSiteSettings')} onClick={this.onToggleSavedSiteSettings} />
        </div>
        <div className='formSection clearBrowsingDataButtons'>
          <Button l10nId='cancel' className='whiteButton' onClick={this.props.onHide} />
          <Button l10nId='clear' className='primaryButton clearDataButton' onClick={this.onClear} />
        </div>
        <div className='formSection clearBrowsingDataWarning'>
          <div data-l10n-id='clearDataWarning' />
        </div>
      </div>
    </Dialog>
  }
}

module.exports = ClearBrowsingDataPanel
