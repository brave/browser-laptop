/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Dialog = require('./dialog')
const Button = require('./button')
const SwitchControl = require('./switchControl')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')

class ClearBrowsingDataPanel extends ImmutableComponent {
  constructor () {
    super()
    this.onToggleBrowserHistory = this.onToggleSetting.bind(this, 'browserHistory')
    this.onToggleDownloadHistory = this.onToggleSetting.bind(this, 'downloadHistory')
    this.onToggleCachedImagesAndFiles = this.onToggleSetting.bind(this, 'cachedImagesAndFiles')
    this.onToggleSavedPasswords = this.onToggleSetting.bind(this, 'savedPasswords')
    this.onToggleAllSiteCookies = this.onToggleSetting.bind(this, 'allSiteCookies')
    this.onClear = this.onClear.bind(this)
  }
  onToggleSetting (setting, e) {
    windowActions.setClearBrowsingDataDetail(this.props.clearBrowsingDataDetail.set(setting, e.target.value))
  }
  onClear () {
    appActions.clearAppData(this.props.clearBrowsingDataDetail)
    this.props.onHide()
  }
  render () {
    return <Dialog onHide={this.props.onHide} className='clearBrowsingDataPanel' isClickDismiss>
      <div className='clearBrowsingData' onClick={(e) => e.stopPropagation()}>
        <div className='formSection clearBrowsingDataTitle' data-l10n-id='clearBrowsingData' />
        <div className='formSection clearBrowsingDataOptions'>
          <SwitchControl className='browserHistorySwitch' rightl10nId='browserHistory' checkedOn={this.props.clearBrowsingDataDetail.get('browserHistory')} onClick={this.onToggleBrowserHistory} />
          <SwitchControl rightl10nId='downloadHistory' checkedOn={this.props.clearBrowsingDataDetail.get('downloadHistory')} onClick={this.onToggleDownloadHistory} />
          <SwitchControl rightl10nId='cachedImagesAndFiles' checkedOn={this.props.clearBrowsingDataDetail.get('cachedImagesAndFiles')} onClick={this.onToggleCachedImagesAndFiles} />
          <SwitchControl rightl10nId='savedPasswords' checkedOn={this.props.clearBrowsingDataDetail.get('savedPasswords')} onClick={this.onToggleSavedPasswords} />
          <SwitchControl rightl10nId='allSiteCookies' checkedOn={this.props.clearBrowsingDataDetail.get('allSiteCookies')} onClick={this.onToggleAllSiteCookies} />
        </div>
        <div className='formSection clearBrowsingDataButtons'>
          <Button l10nId='cancel' className='secondaryAltButton' onClick={this.props.onHide} />
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
