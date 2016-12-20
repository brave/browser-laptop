/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const messages = require('../constants/messages')
const Immutable = require('immutable')
const ImmutableComponent = require('../components/immutableComponent')
const aboutActions = require('./aboutActions')
const Button = require('../components/button')

const ipc = window.chrome.ipcRenderer

require('../../less/about/autofill.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class AddressItem extends ImmutableComponent {
  constructor () {
    super()
    this.onDelete = this.onDelete.bind(this)
    this.onEdit = this.onEdit.bind(this)
  }

  onDelete () {
    aboutActions.removeAutofillAddress(this.props.address)
  }

  onEdit () {
    aboutActions.editAutofillAddress(this.props.address)
  }

  render () {
    const address = this.props.address
    return <tr className='autofillItem'>
      <td className='autofillActions'>
        <span className='autofillAction fa fa-times' title='Delete address'
          onClick={this.onDelete} />
      </td>
      <td className='addressName'>{address.get('name')}</td>
      <td className='organization'>{address.get('organization')}</td>
      <td className='streetAddress'>{address.get('streetAddress')}</td>
      <td className='city'>{address.get('city')}</td>
      <td className='state'>{address.get('state')}</td>
      <td className='postalCode'>{address.get('postalCode')}</td>
      <td className='country'>{address.get('country')}</td>
      <td className='phone'>{address.get('phone')}</td>
      <td className='email'>{address.get('email')}</td>
      <td className='autofillActions'>
        <span className='autofillAction fa fa-pencil-square-o' title='Edit address'
          onClick={this.onEdit} />
      </td>
    </tr>
  }
}

class CreditCardItem extends ImmutableComponent {
  constructor () {
    super()
    this.onDelete = this.onDelete.bind(this)
    this.onEdit = this.onEdit.bind(this)
  }

  onDelete () {
    aboutActions.removeAutofillCreditCard(this.props.creditCard)
  }

  onEdit () {
    aboutActions.editAutofillCreditCard(this.props.creditCard)
  }

  render () {
    const creditCard = this.props.creditCard
    return <tr className='autofillItem'>
      <td className='autofillActions'>
        <span className='autofillAction fa fa-times' title='Delete creditCard'
          onClick={this.onDelete} />
      </td>
      <td className='creditCardName'>{creditCard.get('name')}</td>
      <td className='creditCardNumber'>{
        creditCard.get('card') !== undefined ? '***' + creditCard.get('card').slice(-4) : null
      }</td>
      <td className='creditCardPExpirationDate'>
        {creditCard.get('month') + '/' + creditCard.get('year')}
      </td>
      <td className='autofillActions'>
        <span className='autofillAction fa fa-pencil-square-o' title='Edit creditCard'
          onClick={this.onEdit} />
      </td>
    </tr>
  }
}

class AboutAutofill extends React.Component {
  constructor () {
    super()
    this.state = {
      addressesDetails: new Immutable.List(),
      creditCardsDetails: new Immutable.List()
    }
    ipc.on(messages.AUTOFILL_ADDRESSES_UPDATED, (e, detail) => {
      if (detail) {
        this.setState({
          addressesDetails: Immutable.fromJS(detail)
        })
      }
    })
    ipc.on(messages.AUTOFILL_CREDIT_CARDS_UPDATED, (e, detail) => {
      if (detail) {
        this.setState({
          creditCardsDetails: Immutable.fromJS(detail)
        })
      }
    })
    this.onAddAddress = this.onAddAddress.bind(this)
    this.onAddCreditCard = this.onAddCreditCard.bind(this)
  }

  onAddAddress () {
    aboutActions.addAutofillAddress()
  }

  onAddCreditCard () {
    aboutActions.addAutofillCreditCard()
  }

  get isAddresssEmpty () {
    return !this.state.addressesDetails || !this.state.addressesDetails.size
  }

  get isCreditCardsEmpty () {
    return !this.state.creditCardsDetails || !this.state.creditCardsDetails.size
  }

  render () {
    var savedAddresssPage = this.isAddresssEmpty
    ? <div><span className='notSaved' data-l10n-id='noAddressesSaved' /></div>
    : <div>
      <table className='autofillList'>
        <thead>
          <tr>
            <th />
            <th data-l10n-id='name' />
            <th data-l10n-id='organization' />
            <th data-l10n-id='streetAddress' />
            <th data-l10n-id='city' />
            <th data-l10n-id='state' />
            <th data-l10n-id='postalCode' />
            <th data-l10n-id='country' />
            <th data-l10n-id='phone' />
            <th data-l10n-id='email' />
          </tr>
        </thead>
        <tbody>
          {
            this.state.addressesDetails.sort((a, b) => {
              return a.get('name') > b.get('name') ? 1 : -1
            }).map((item) =>
              <AddressItem address={item} />)
          }
        </tbody>
      </table>
    </div>

    var savedCreditCardsPage = this.isCreditCardsEmpty
    ? <div><span className='notSaved' data-l10n-id='noCreditCardsSaved' /></div>
    : <div>
      <table className='autofillList'>
        <thead>
          <tr>
            <th />
            <th data-l10n-id='name' />
            <th data-l10n-id='creditCardNumber' />
            <th data-l10n-id='expirationDate' />
          </tr>
        </thead>
        <tbody>
          {
            this.state.creditCardsDetails.sort((a, b) => {
              return a.get('name') > b.get('name') ? 1 : -1
            }).map((item) =>
              <CreditCardItem creditCard={item} />)
          }
        </tbody>
      </table>
    </div>
    return <div className='autofillPage'>
      <h1 data-l10n-id='autofillTitle' />
      <div className='autofillPageContent'>
        <div className='autofillPageFooter' />
        <h2 data-l10n-id='addresses' />
        <div className='autofillPageContent'>
          {savedAddresssPage}
          <Button l10nId='addAddress' className='primaryButton addAddressButton' onClick={this.onAddAddress} />
        </div>
        <div className='autofillPageFooter' />
        <h2 data-l10n-id='creditCards' />
        <div className='autofillPageContent'>
          {savedCreditCardsPage}
          <Button l10nId='addCreditCard' className='primaryButton addCreditCardButton' onClick={this.onAddCreditCard} />
        </div>
      </div>
    </div>
  }
}

module.exports = <AboutAutofill />
