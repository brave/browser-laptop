/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../app/renderer/components/immutableComponent')
const Dialog = require('./dialog')
const Button = require('./button')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const KeyCodes = require('../../app/common/constants/keyCodes')

class AutofillAddressPanel extends ImmutableComponent {
  constructor () {
    super()
    this.onNameChange = this.onNameChange.bind(this)
    this.onOrganizationChange = this.onOrganizationChange.bind(this)
    this.onStreetAddressChange = this.onStreetAddressChange.bind(this)
    this.onCityChange = this.onCityChange.bind(this)
    this.onStateChange = this.onStateChange.bind(this)
    this.onPostalCodeChange = this.onPostalCodeChange.bind(this)
    this.onCountryChange = this.onCountryChange.bind(this)
    this.onPhoneChange = this.onPhoneChange.bind(this)
    this.onEmailChange = this.onEmailChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onSave = this.onSave.bind(this)
    this.onClick = this.onClick.bind(this)
  }
  onNameChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('name', e.target.value)
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onOrganizationChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('organization', e.target.value)
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onStreetAddressChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('streetAddress', e.target.value)
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onCityChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('city', e.target.value)
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onStateChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('state', e.target.value)
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onPostalCodeChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('postalCode', e.target.value)
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onCountryChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('country', e.target.value)
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onPhoneChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('phone', e.target.value)
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onEmailChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('email', e.target.value)
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onKeyDown (e) {
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        this.onSave()
        break
      case KeyCodes.ESC:
        this.props.onHide()
        break
    }
  }
  onSave () {
    appActions.addAutofillAddress(this.props.currentDetail, this.props.originalDetail)
    this.props.onHide()
  }
  onClick (e) {
    e.stopPropagation()
  }
  get disableSaveButton () {
    let currentDetail = this.props.currentDetail
    if (!currentDetail.size) return true
    if (!currentDetail.get('name') && !currentDetail.get('organization') &&
      !currentDetail.get('streetAddress') && !currentDetail.get('city') &&
      !currentDetail.get('state') && !currentDetail.get('country') &&
      !currentDetail.get('phone') && !currentDetail.get('email')) return true
    return false
  }

  render () {
    return <Dialog onHide={this.props.onHide} className='manageAutofillDataPanel autofillAddressPanel' isClickDismiss>
      <div className='genericForm manageAutofillData' onClick={this.onClick}>
        <div className='formRow manageAutofillDataTitle' data-l10n-id='editAddress' />
        <div className='genericFormTable'>
          <div id='nameOnAddress' className='formRow manageAutofillDataOptions'>
            <label data-l10n-id='name' htmlFor='nameOnAddress' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onNameChange}
              value={this.props.currentDetail.get('name')}
              ref={(nameOnAddress) => { this.nameOnAddress = nameOnAddress }} />
          </div>
          <div id='organization' className='formRow manageAutofillDataOptions'>
            <label data-l10n-id='organization' htmlFor='organization' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onOrganizationChange}
              value={this.props.currentDetail.get('organization')} />
          </div>
          <div id='streetAddress' className='formRow manageAutofillDataOptions'>
            <label data-l10n-id='streetAddress' htmlFor='streetAddress' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onStreetAddressChange}
              value={this.props.currentDetail.get('streetAddress')} />
          </div>
          <div id='city' className='formRow manageAutofillDataOptions'>
            <label data-l10n-id='city' htmlFor='city' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onCityChange}
              value={this.props.currentDetail.get('city')} />
          </div>
          <div id='state' className='formRow manageAutofillDataOptions'>
            <label data-l10n-id='state' htmlFor='state' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onStateChange}
              value={this.props.currentDetail.get('state')} />
          </div>
          <div id='postalCode' className='formRow manageAutofillDataOptions'>
            <label data-l10n-id='postalCode' htmlFor='postalCode' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onPostalCodeChange}
              value={this.props.currentDetail.get('postalCode')} />
          </div>
          <div id='country' className='formRow manageAutofillDataOptions'>
            <label data-l10n-id='country' htmlFor='country' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onCountryChange}
              value={this.props.currentDetail.get('country')} />
          </div>
          <div id='phone' className='formRow manageAutofillDataOptions'>
            <label data-l10n-id='phone' htmlFor='phone' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onPhoneChange}
              value={this.props.currentDetail.get('phone')} />
          </div>
          <div id='email' className='formRow manageAutofillDataOptions'>
            <label data-l10n-id='email' htmlFor='email' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onEmailChange}
              value={this.props.currentDetail.get('email')} />
          </div>
          <div className='formRow manageAutofillDataButtons'>
            <Button l10nId='cancel' className='whiteButton' onClick={this.props.onHide} />
            <Button l10nId='save' className='primaryButton saveAddressButton' onClick={this.onSave}
              disabled={this.disableSaveButton} />
          </div>
        </div>
      </div>
    </Dialog>
  }
}

module.exports = AutofillAddressPanel
