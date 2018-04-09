/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Component
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const Button = require('../common/button')
const {
  CommonForm,
  CommonFormSection,
  CommonFormDropdown,
  CommonFormTextbox,
  commonFormStyles
} = require('../common/commonForm')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')

// Constants
const KeyCodes = require('../../../common/constants/keyCodes')

// Styles
const commonStyles = require('../styles/commonStyles')
const globalStyles = require('../styles/global')

class AutofillCreditCardPanel extends React.Component {
  constructor (props) {
    super(props)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onSave = this.onSave.bind(this)
  }

  onNameChange (e) {
    windowActions.setAutofillCreditCardDetail('name', e.target.value)
  }

  onCardChange (e) {
    windowActions.setAutofillCreditCardDetail('card', e.target.value)
  }

  onExpMonthChange (e) {
    windowActions.setAutofillCreditCardDetail('month', e.target.value)
  }

  onExpYearChange (e) {
    windowActions.setAutofillCreditCardDetail('year', e.target.value)
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
    appActions.addAutofillCreditCard(Immutable.fromJS({
      name: this.props.name,
      card: this.props.card,
      month: this.props.month,
      year: this.props.year,
      guid: this.props.guid
    }))
    this.onHide()
  }

  onClick (e) {
    e.stopPropagation()
  }

  componentDidMount () {
    this.nameOnCard.focus()
  }

  onHide () {
    windowActions.setAutofillCreditCardDetail()
  }

  get expirationMonths () {
    const expMonth = []
    for (let i = 1; i <= 12; ++i) {
      let mon = i < 10 ? '0' + i.toString() : i.toString()
      expMonth.push(<option value={mon}>{mon}</option>)
    }

    return expMonth
  }

  get expirationYears () {
    const expYear = []
    const today = new Date()
    const year = today.getFullYear()
    for (let i = year; i <= year + 9; ++i) {
      expYear.push(<option value={i}>{i}</option>)
    }

    return expYear
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const detail = currentWindow.get('autofillCreditCardDetail', Immutable.Map())

    // const cardRexEx = /^[0-9]{3,4}[" "-]{0,1}[0-9]{3,4}[" "-]{0,1}[0-9]{3,4}[" "-]{0,1}[0-9]{1,7}$/
    const cardRexEx = /^[0-9]{13,19}$/
    const visaCard = /^(4)[0-9]{12,18}$/
    const americanCard = /^(34|37)[0-9]{13}$/
    const masterCard = /^5[1-5][0-9]{14}$/
    const discoverCard = /^(6011|64|65)[0-9]{14,17}$/
    const jcbCard = /^35[2-8][0-9][0-9]{12,15}$/
    const dinersEnRouteCard = /^(2014|2149)[0-9]{11}$/
    const dinersInternationalCard = /^36[0-9]{12,17}$/
    const chinaUnionPayCard = /^(62)[0-9]{14,17}$/
    

    const props = {}
    props.name = detail.get('name', '')
    props.card = detail.get('card', '')
    props.month = detail.get('month')
    props.year = detail.get('year')
    props.guid = detail.get('guid', '-1')
    props.disableSaveButton = detail.isEmpty() ||
      (!detail.get('name') && !detail.get('card')) ||
      (!cardRexEx.test(detail.get('card')) && !visaCard.test(detail.get('card')) &&
       !masterCard.test(detail.get('card')) && !americanCard.test(detail.get('card')) &&
       !chinaUnionPayCard.test(detail.get('card')) && !jcbCard.test(detail.get('card')) &&
       !dinersEnRouteCard.test(detail.get('card')) && !dinersInternationalCard.test(detail.get('card')))
    props.visa = visaCard.test(detail.get('card'))
    props.master = masterCard.test(detail.get('card'))
    props.american = americanCard.test(detail.get('card'))
    props.discover = discoverCard.test(detail.get('card'))
    props.jcb = jcbCard.test(detail.get('card'))
    props.chinaUnion = chinaUnionPayCard.test(detail.get('card'))
    props.dinersEnRoute = dinersEnRouteCard.test(detail.get('card'))
    props.dinersInter = dinersInternationalCard.test(detail.get('card'))

    return props
  }

  render () {
    return <Dialog onHide={this.onHide} testId='autofillCreditCardPanel' isClickDismiss>
      <CommonForm onClick={this.onClick}>
        <CommonFormSection title
          l10nId='editCreditCard'
          testId='manageAutofillDataTitle'
        />
        <CommonFormSection>
          <div className={css(commonFormStyles.sectionWrapper)}>
            <div className={css(commonFormStyles.inputWrapper, commonFormStyles.inputWrapper__label)}>
              <label data-l10n-id='name' htmlFor='nameOnCard' />
              <label className={css(commonFormStyles.input__marginRow)} data-l10n-id='creditCardNumber' htmlFor='creditCardNumber' />
            </div>
            <div className={css(commonFormStyles.inputWrapper, commonFormStyles.inputWrapper__input)}>
              <div data-test-id='creditCardNameWrapper'>
                <input className={css(
                    commonStyles.formControl,
                    commonStyles.textbox,
                    commonStyles.textbox__outlineable,
                    commonFormStyles.input__box,
                    styles.input
                  )}
                  ref={(nameOnCard) => { this.nameOnCard = nameOnCard }}
                  defaultValue={this.props.name}
                  type='text'
                  data-test-id='creditCardName'
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onNameChange}
                />
              </div>
              <div data-test-id='creditCardNumberWrapper'
                className={css(commonFormStyles.input__marginRow)
              }>
                <CommonFormTextbox
                  defaultValue={this.props.card}
                  data-test-id='creditCardNumber'
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onCardChange}
                />
                <div hidden={!this.props.visa}>
                  Visa
                </div>
                <div hidden={!this.props.american}>
                  American
                </div>
                <div hidden={!this.props.master}>
                  Master
                </div>
                <div hidden={!this.props.discover}>
                  Discover
                </div>
                <div hidden={!this.props.jcb}>
                  JCB
                </div>
                <div hidden={!this.props.chinaUnion}>
                  China Union Pay
                </div>
                <div hidden={!this.props.dinersEnRoute}>
                  Dinners En Route
                </div>
                <div hidden={!this.props.dinersInter}>
                  Dinners International
                </div>
              </div>
            </div>
          </div>
          <div className={css(
            commonFormStyles.sectionWrapper,
            styles.sectionWrapper__expirationDate
          )}>
            <div className={css(
              commonFormStyles.inputWrapper__label,
              commonFormStyles.input__marginRow
            )}>
              <label data-l10n-id='expirationDate' htmlFor='expirationDate' />
            </div>
            <div className={css(
              commonFormStyles.input__marginRow,
              styles.expirationDate__dropdowns
            )}>
              <CommonFormDropdown
                value={this.props.month}
                onChange={this.onExpMonthChange}
                data-test-id='expMonthSelect'
              >
                {this.expirationMonths}
              </CommonFormDropdown>
              <div className={css(styles.dropdown__right)}>
                <CommonFormDropdown
                  value={this.props.year}
                  onChange={this.onExpYearChange}
                  data-test-id='expYearSelect'
                >
                  {this.expirationYears}
                </CommonFormDropdown>
              </div>
            </div>
          </div>
        </CommonFormSection>
        <CommonFormSection buttons>
          <Button className='whiteButton'
            l10nId='cancel'
            testId='cancelCreditCardButton'
            onClick={this.onHide}
          />
          <Button className='primaryButton'
            disabled={this.props.disableSaveButton}
            l10nId='save'
            testId='saveCreditCardButton'
            onClick={this.onSave}
          />
        </CommonFormSection>
      </CommonForm>
    </Dialog>
  }
}

const styles = StyleSheet.create({
  // Copied from textbox.js
  input: {
    width: '100%'
  },

  sectionWrapper__expirationDate: {
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  expirationDate__dropdowns: {
    display: 'flex'
  },
  dropdown__right: {
    marginLeft: `calc(${globalStyles.spacing.dialogInsideMargin} / 3)`
  }
})

module.exports = ReduxComponent.connect(AutofillCreditCardPanel)
