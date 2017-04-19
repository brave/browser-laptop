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

    return <Dialog onHide={this.props.onHide} className='manageAutofillDataPanel autofillCreditCardPanel' isClickDismiss>
      <div className='genericForm manageAutofillData' onClick={this.onClick}>
        <div className='formRow manageAutofillDataTitle' data-l10n-id='editCreditCard' />
        <div className='genericFormTable'>
          <div id='nameOnCard' className='formRow manageAutofillDataOptions'>
            <label data-l10n-id='name' htmlFor='nameOnCard' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onNameChange}
              value={this.props.currentDetail.get('name')} ref={(nameOnCard) => { this.nameOnCard = nameOnCard }} />
          </div>
          <div id='creditCardNumber' className='formRow manageAutofillDataOptions'>
            <label data-l10n-id='creditCardNumber' htmlFor='creditCardNumber' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onCardChange}
              value={this.props.currentDetail.get('card')} />
          </div>
          <div id='expirationDate' className='formRow manageAutofillDataOptions'>
            <label data-l10n-id='expirationDate' htmlFor='expirationDate' />
            <select value={this.props.currentDetail.get('month')}
              onChange={this.onExpMonthChange} className='expMonthSelect' >
              {ExpMonth}
            </select>
            <select value={this.props.currentDetail.get('year')}
              onChange={this.onExpYearChange} className='expYearSelect' >
              {ExpYear}
            </select>
          </div>
          <div className='formRow manageAutofillDataButtons'>
            <Button l10nId='cancel' className='whiteButton' onClick={this.props.onHide} />
            <Button l10nId='save' className='primaryButton saveCreditCardButton' onClick={this.onSave}
              disabled={this.disableSaveButton} />
          </div>
        </div>
      </div>
    </Dialog>
  }
}

module.exports = AutofillCreditCardPanel
