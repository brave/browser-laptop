/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const Dialog = require('../common/dialog')
const Button = require('../common/button')
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')
const KeyCodes = require('../../../common/constants/keyCodes')

const {css} = require('aphrodite/no-important')
const commonStyles = require('../styles/commonStyles')

const {
  CommonFormLarge,
  CommonFormSection,
  CommonFormTitle,
  CommonFormTextbox,
  CommonFormButtonWrapper,
  commonFormStyles
} = require('../common/commonForm')

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
  componentDidMount () {
    this.nameOnAddress.focus()
  }
  render () {
    return <Dialog onHide={this.props.onHide} testId='autofillAddressPanel' isClickDismiss>
      <CommonFormLarge onClick={this.onClick}>
        <CommonFormTitle data-l10n-id='editAddress' />
        <CommonFormSection>
          <div className={css(commonFormStyles.sectionWrapper)}>
            <div className={css(commonFormStyles.inputWrapper, commonFormStyles.inputWrapper__label)}>
              <label data-l10n-id='name' htmlFor='nameOnAddress' />
              <label className={css(commonFormStyles.input__marginRow)} data-l10n-id='organization' htmlFor='organization' />
              <label className={css(commonFormStyles.input__marginRow)} data-l10n-id='streetAddress' htmlFor='streetAddress' />
              <label className={css(commonFormStyles.input__marginRow)} data-l10n-id='city' htmlFor='city' />
              <label className={css(commonFormStyles.input__marginRow)} data-l10n-id='state' htmlFor='state' />
              <label className={css(commonFormStyles.input__marginRow)} data-l10n-id='postalCode' htmlFor='postalCode' />
              <label className={css(commonFormStyles.input__marginRow)} data-l10n-id='country' htmlFor='country' />
              <label className={css(commonFormStyles.input__marginRow)} data-l10n-id='phone' htmlFor='phone' />
              <label className={css(commonFormStyles.input__marginRow)} data-l10n-id='email' htmlFor='email' />
            </div>
            <div className={css(commonFormStyles.inputWrapper, commonFormStyles.inputWrapper__input)}>
              <input className={css(
                commonStyles.formControl,
                commonStyles.textbox,
                commonStyles.textbox__outlineable,
                commonFormStyles.input__box
              )}
                data-test-id='nameOnAddress'
                spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onNameChange}
                value={this.props.currentDetail.get('name') || ''}
                ref={(nameOnAddress) => { this.nameOnAddress = nameOnAddress }} />
              <div className={css(commonFormStyles.input__marginRow)}>
                <CommonFormTextbox
                  data-test-id='organization'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onOrganizationChange}
                  value={this.props.currentDetail.get('organization')} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <CommonFormTextbox
                  data-test-id='streetAddress'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onStreetAddressChange}
                  value={this.props.currentDetail.get('streetAddress')} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <CommonFormTextbox
                  data-test-id='city'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onCityChange}
                  value={this.props.currentDetail.get('city')} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <CommonFormTextbox
                  data-test-id='state'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onStateChange}
                  value={this.props.currentDetail.get('state')} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <CommonFormTextbox
                  data-test-id='postalCode'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onPostalCodeChange}
                  value={this.props.currentDetail.get('postalCode')} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <CommonFormTextbox
                  data-test-id='country'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onCountryChange}
                  value={this.props.currentDetail.get('country')} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <CommonFormTextbox
                  data-test-id='phone'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onPhoneChange}
                  value={this.props.currentDetail.get('phone')} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <CommonFormTextbox
                  data-test-id='email'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onEmailChange}
                  value={this.props.currentDetail.get('email')} />
              </div>
            </div>
          </div>
        </CommonFormSection>
        <CommonFormButtonWrapper>
          <Button className='whiteButton'
            l10nId='cancel'
            testId='cancelAddressButton'
            onClick={this.props.onHide}
          />
          <Button className='primaryButton'
            disabled={this.disableSaveButton}
            l10nId='save'
            testId='saveAddressButton'
            onClick={this.onSave}
          />
        </CommonFormButtonWrapper>
      </CommonFormLarge>
    </Dialog>
  }
}

module.exports = AutofillAddressPanel
