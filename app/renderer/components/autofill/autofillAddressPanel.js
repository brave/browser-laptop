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
  CommonFormButtonWrapper,
  commonFormStyles
} = require('../common/commonForm')

const commonForm = css(
  commonStyles.formControl,
  commonStyles.textbox,
  commonStyles.textbox__outlineable,
  commonStyles.isCommonForm,
  commonFormStyles.input__box
)

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
    if (this.nameOnAddress.value !== e.target.value) {
      this.nameOnAddress.value = e.target.value
    }
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onOrganizationChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('organization', e.target.value)
    if (this.organization.value !== e.target.value) {
      this.organization.value = e.target.value
    }
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onStreetAddressChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('streetAddress', e.target.value)
    if (this.streetAddress.value !== e.target.value) {
      this.streetAddress.value = e.target.value
    }
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onCityChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('city', e.target.value)
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
    if (this.city.value !== e.target.value) {
      this.city.value = e.target.value
    }
  }
  onStateChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('state', e.target.value)
    if (this.state.value !== e.target.value) {
      this.state.value = e.target.value
    }
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onPostalCodeChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('postalCode', e.target.value)
    if (this.postalCode.value !== e.target.value) {
      this.postalCode.value = e.target.value
    }
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onCountryChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('country', e.target.value)
    if (this.country.value !== e.target.value) {
      this.country.value = e.target.value
    }
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onPhoneChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('phone', e.target.value)
    if (this.phone.value !== e.target.value) {
      this.phone.value = e.target.value
    }
    windowActions.setAutofillAddressDetail(currentDetail, this.props.originalDetail)
  }
  onEmailChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('email', e.target.value)
    if (this.email.value !== e.target.value) {
      this.email.value = e.target.value
    }
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
    this.nameOnAddress.value = this.props.currentDetail.get('name') || ''
    this.organization.value = this.props.currentDetail.get('organization') || ''
    this.streetAddress.value = this.props.currentDetail.get('streetAddress') || ''
    this.city.value = this.props.currentDetail.get('city') || ''
    this.state.value = this.props.currentDetail.get('state') || ''
    this.postalCode.value = this.props.currentDetail.get('postalCode') || ''
    this.country.value = this.props.currentDetail.get('country') || ''
    this.phone.value = this.props.currentDetail.get('phone') || ''
    this.email.value = this.props.currentDetail.get('email') || ''
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
                ref={(nameOnAddress) => { this.nameOnAddress = nameOnAddress }} />
              <div className={css(commonFormStyles.input__marginRow)}>
                <input className={commonForm}
                  data-test-id='organization'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onOrganizationChange}
                  ref={(organization) => { this.organization = organization }} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input className={commonForm}
                  data-test-id='streetAddress'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onStreetAddressChange}
                  ref={(streetAddress) => { this.streetAddress = streetAddress }} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input className={commonForm}
                  data-test-id='city'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onCityChange}
                  ref={(city) => { this.city = city }} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input className={commonForm}
                  data-test-id='state'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onStateChange}
                  ref={(state) => { this.state = state }} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input className={commonForm}
                  data-test-id='postalCode'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onPostalCodeChange}
                  ref={(postalCode) => { this.postalCode = postalCode }} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input className={commonForm}
                  data-test-id='country'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onCountryChange}
                  ref={(country) => { this.country = country }} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input className={commonForm}
                  data-test-id='phone'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onPhoneChange}
                  ref={(phone) => { this.phone = phone }} />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input className={commonForm}
                  data-test-id='email'
                  spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onEmailChange}
                  ref={(email) => { this.email = email }} />
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
