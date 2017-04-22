/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const Dialog = require('../../../../js/components/dialog')
const Button = require('../../../../js/components/button')
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')
const KeyCodes = require('../../../common/constants/keyCodes')

const {StyleSheet, css} = require('aphrodite/no-important')
const commonStyles = require('../styles/commonStyles')
const globalStyles = require('../styles/global')

const {
  CommonForm,
  CommonFormSection,
  CommonFormTitle,
  CommonFormDropdown,
  CommonFormTextbox,
  CommonFormButtonWrapper,
  commonFormStyles
} = require('../commonForm')

class AutofillCreditCardPanel extends ImmutableComponent {
  constructor () {
    super()
    this.onNameChange = this.onNameChange.bind(this)
    this.onCardChange = this.onCardChange.bind(this)
    this.onExpMonthChange = this.onExpMonthChange.bind(this)
    this.onExpYearChange = this.onExpYearChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onSave = this.onSave.bind(this)
    this.onClick = this.onClick.bind(this)
  }
  onNameChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('name', e.target.value)
    windowActions.setAutofillCreditCardDetail(currentDetail, this.props.originalDetail)
  }
  onCardChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('card', e.target.value)
    windowActions.setAutofillCreditCardDetail(currentDetail, this.props.originalDetail)
  }
  onExpMonthChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('month', e.target.value)
    windowActions.setAutofillCreditCardDetail(currentDetail, this.props.originalDetail)
  }
  onExpYearChange (e) {
    let currentDetail = this.props.currentDetail
    currentDetail = currentDetail.set('year', e.target.value)
    windowActions.setAutofillCreditCardDetail(currentDetail, this.props.originalDetail)
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
    appActions.addAutofillCreditCard(this.props.currentDetail, this.props.originalDetail)
    this.props.onHide()
  }
  onClick (e) {
    e.stopPropagation()
  }
  get disableSaveButton () {
    let currentDetail = this.props.currentDetail
    if (!currentDetail.size) return true
    if (!currentDetail.get('name') && !currentDetail.get('card')) return true
    return false
  }
  render () {
    var ExpMonth = []
    for (let i = 1; i <= 12; ++i) {
      let mon = i < 10 ? '0' + i.toString() : i.toString()
      ExpMonth.push(<option value={mon}>{mon}</option>)
    }
    var ExpYear = []
    var today = new Date()
    var year = today.getFullYear()
    for (let i = year; i <= year + 9; ++i) {
      ExpYear.push(<option value={i}>{i}</option>)
    }

    return <Dialog onHide={this.props.onHide} testId='autofillCreditCardPanel' isClickDismiss>
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
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onNameChange}
                  value={this.props.currentDetail.get('name')}
                  ref={(nameOnCard) => { this.nameOnCard = nameOnCard }}
                />
              </div>
              <div data-test-id='creditCardNumberWrapper'
                className={css(commonFormStyles.input__marginRow)
              }>
                <CommonFormTextbox
                  spellCheck='false'
                  onKeyDown={this.onKeyDown}
                  onChange={this.onCardChange}
                  value={this.props.currentDetail.get('card')}
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
                value={this.props.currentDetail.get('month')}
                onChange={this.onExpMonthChange}
                data-test-id='expMonthSelect'>
                {ExpMonth}
              </CommonFormDropdown>
              <div className={css(styles.dropdown__right)}>
                <CommonFormDropdown
                  value={this.props.currentDetail.get('year')}
                  onChange={this.onExpYearChange}
                  data-test-id='expYearSelect'>
                  {ExpYear}
                </CommonFormDropdown>
              </div>
            </div>
          </div>
        </CommonFormSection>
        <CommonFormButtonWrapper>
          <Button className='whiteButton'
            l10nId='cancel'
            testId='cancelCreditCardButton'
            onClick={this.props.onHide}
          />
          <Button className='primaryButton'
            disabled={this.disableSaveButton}
            l10nId='save'
            testId='saveCreditCardButton'
            onClick={this.onSave}
          />
        </CommonFormButtonWrapper>
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

module.exports = AutofillCreditCardPanel
