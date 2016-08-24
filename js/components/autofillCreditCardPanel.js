/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Dialog = require('./dialog')
const Button = require('./button')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const KeyCodes = require('../constants/keyCodes')

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
  get displayMonth () {
    return this.props.currentDetail.get('month').replace('0', '')
  }
  render () {
    var ExpMonth = []
    for (let i = 1; i <= 12; ++i) {
      ExpMonth.push(<option value={i}>{i}</option>)
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
          <div id='nameOnCard' className='formRow'>
            <label data-l10n-id='name' htmlFor='nameOnCard' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onNameChange}
              value={this.props.currentDetail.get('name')} ref={(nameOnCard) => { this.nameOnCard = nameOnCard }} />
          </div>
          <div id='creditCardNumber' className='formRow'>
            <label data-l10n-id='creditCardNumber' htmlFor='creditCardNumber' />
            <input spellCheck='false' onKeyDown={this.onKeyDown} onChange={this.onCardChange}
              value={this.props.currentDetail.get('card')} />
          </div>
          <div id='expirationDate' className='formRow'>
            <label data-l10n-id='expirationDate' htmlFor='expirationDate' />
            <select value={this.displayMonth}
              onChange={this.onExpMonthChange} className='formSelect expMonthSelect' >
              {ExpMonth}
            </select>
            <select value={this.props.currentDetail.get('year')}
              onChange={this.onExpYearChange} className='formSelect expYearSelect' >
              {ExpYear}
            </select>
          </div>
          <div className='formRow'>
            <Button l10nId='cancel' className='secondaryAltButton' onClick={this.props.onHide} />
            <Button l10nId='save' className='primaryButton saveCreditCardButton' onClick={this.onSave} />
          </div>
        </div>
      </div>
    </Dialog>
  }
}

module.exports = AutofillCreditCardPanel
