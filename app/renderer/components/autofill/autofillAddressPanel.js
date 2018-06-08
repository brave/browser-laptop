/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const Button = require('../common/button')
const {
  CommonFormLarge,
  CommonFormSection,
  CommonFormTitle,
  CommonFormDropdown,
  CommonFormButtonWrapper,
  commonFormStyles
} = require('../common/commonForm')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')

// Constants
const KeyCodes = require('../../../common/constants/keyCodes')
const countryCodes = require('../../../common/constants/countryCodes')

// Styles
const commonStyles = require('../styles/commonStyles')

// Localization
const locale = require('../../../../js/l10n')

const commonForm = css(
  commonStyles.formControl,
  commonStyles.textbox,
  commonStyles.textbox__outlineable,
  commonStyles.isCommonForm,
  commonFormStyles.input__box
)

class AutofillAddressPanel extends React.Component {
  constructor (props) {
    super(props)
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
    windowActions.setAutofillAddressDetail('name', e.target.value)
  }
  onOrganizationChange (e) {
    windowActions.setAutofillAddressDetail('organization', e.target.value)
  }
  onStreetAddressChange (e) {
    windowActions.setAutofillAddressDetail('streetAddress', e.target.value)
  }
  onCityChange (e) {
    windowActions.setAutofillAddressDetail('city', e.target.value)
  }
  onStateChange (e) {
    windowActions.setAutofillAddressDetail('state', e.target.value)
  }
  onPostalCodeChange (e) {
    windowActions.setAutofillAddressDetail('postalCode', e.target.value)
  }
  onCountryChange (e) {
    windowActions.setAutofillAddressDetail('country', e.target.value)
  }
  onPhoneChange (e) {
    windowActions.setAutofillAddressDetail('phone', e.target.value)
  }
  onEmailChange (e) {
    windowActions.setAutofillAddressDetail('email', e.target.value)
  }

  onKeyDown (e) {
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        this.onSave()
        break
      case KeyCodes.ESC:
        this.onHide()
        break
    }
  }

  onSave () {
    appActions.addAutofillAddress(Immutable.fromJS({
      name: this.props.name,
      organization: this.props.organization,
      streetAddress: this.props.streetAddress,
      city: this.props.city,
      state: this.props.state,
      postalCode: this.props.postalCode,
      country: this.props.country,
      phone: this.props.phone,
      email: this.props.email,
      guid: this.props.guid
    }))
    this.onHide()
  }

  onClick (e) {
    e.stopPropagation()
  }

  componentDidMount () {
    this.nameOnAddress.focus()
  }

  onHide () {
    windowActions.setAutofillAddressDetail()
  }
  get countryList () {
    const countryList = []
    countryList.push(<option />)
    for (let i = 0; i < countryCodes.length; i++) {
      const countryCode = countryCodes[i]
      const localizedCountryName = locale.translation(countryCode)
      countryList.push(<option value={countryCode}>{localizedCountryName}</option>)
    }
    return countryList
  }
  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const detail = currentWindow.get('autofillAddressDetail', Immutable.Map())

    const props = {}
    // Used in renderer
    props.name = detail.get('name', '')
    props.organization = detail.get('organization', '')
    props.streetAddress = detail.get('streetAddress', '')
    props.city = detail.get('city', '')
    props.state = detail.get('state', '')
    props.postalCode = detail.get('postalCode', '')
    props.country = detail.get('country', '')
    props.phone = detail.get('phone', '')
    props.email = detail.get('email', '')
    props.guid = detail.get('guid', '-1')
    props.disableSaveButton = !detail.get('name') && !detail.get('organization') &&
      !detail.get('streetAddress') && !detail.get('city') &&
      !detail.get('state') && !detail.get('country') &&
      !detail.get('phone') && !detail.get('email')

    return props
  }

  render () {
    return <Dialog onHide={this.onHide} testId='autofillAddressPanel' isClickDismiss>
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
              <input
                className={css(
                  commonStyles.formControl,
                  commonStyles.textbox,
                  commonStyles.textbox__outlineable,
                  commonFormStyles.input__box
                )}
                data-test-id='nameOnAddress'
                spellCheck='false'
                ref={(ref) => { this.nameOnAddress = ref }}
                onKeyDown={this.onKeyDown}
                onChange={this.onNameChange}
                defaultValue={this.props.name}
              />
              <div className={css(commonFormStyles.input__marginRow)}>
                <input
                  className={commonForm}
                  data-test-id='organization'
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onOrganizationChange}
                  defaultValue={this.props.organization}
                />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input
                  className={commonForm}
                  data-test-id='streetAddress'
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onStreetAddressChange}
                  defaultValue={this.props.streetAddress}
                />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input
                  className={commonForm}
                  data-test-id='city'
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onCityChange}
                  defaultValue={this.props.city}
                />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input
                  className={commonForm}
                  data-test-id='state'
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onStateChange}
                  defaultValue={this.props.state}
                />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input
                  className={commonForm}
                  data-test-id='postalCode'
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onPostalCodeChange}
                  defaultValue={this.props.postalCode}
                />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <CommonFormDropdown
                  data-isFullWidth
                  data-test-id='country'
                  value={this.props.country}
                  onChange={this.onCountryChange}
                >
                  {this.countryList}
                </CommonFormDropdown>
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input
                  className={commonForm}
                  data-test-id='phone'
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onPhoneChange}
                  defaultValue={this.props.phone}
                />
              </div>
              <div className={css(commonFormStyles.input__marginRow)}>
                <input
                  className={commonForm}
                  data-test-id='email'
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onEmailChange}
                  defaultValue={this.props.email}
                />
              </div>
            </div>
          </div>
        </CommonFormSection>
        <CommonFormButtonWrapper>
          <Button className='whiteButton'
            l10nId='cancel'
            testId='cancelAddressButton'
            onClick={this.onHide}
          />
          <Button className='primaryButton'
            disabled={this.props.disableSaveButton}
            l10nId='save'
            testId='saveAddressButton'
            onClick={this.onSave}
          />
        </CommonFormButtonWrapper>
      </CommonFormLarge>
    </Dialog>
  }
}

module.exports = ReduxComponent.connect(AutofillAddressPanel)
