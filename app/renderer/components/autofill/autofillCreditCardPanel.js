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
  CommonFormTitle,
  CommonFormDropdown,
  CommonFormTextbox,
  CommonFormButtonWrapper,
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

    const props = {}
    props.name = detail.get('name', '')
    props.card = detail.get('card', '')
    props.month = detail.get('month')
    props.year = detail.get('year')
    props.guid = detail.get('guid', '-1')
    props.disableSaveButton = detail.isEmpty() ||
      (!detail.get('name') && !detail.get('card'))

    return props
  }

  render () {
    return <Dialog onHide={this.onHide} testId='autofillCreditCardPanel' isClickDismiss>
      <CommonForm onClick={this.onClick}>
        <CommonFormTitle
          data-test-id='manageAutofillDataTitle'
          data-l10n-id='editCreditCard'
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
        <CommonFormButtonWrapper>
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
        </CommonFormButtonWrapper>
      </CommonForm>
    </Dialog>
  }
}

module.exports = ReduxComponent.connect(AutofillCreditCardPanel)

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
