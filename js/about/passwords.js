/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const messages = require('../constants/messages')
const Immutable = require('immutable')

require('../../less/about/passwords.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class PasswordItem extends React.Component {
  constructor () {
    super()
    this.state = {
      shown: false
    }
  }

  toggleShown () {
    this.setState({
      shown: !this.state.shown
    })
  }

  decryptPassword () {
    // Sends message to main process to decrypt password
  }

  onShow () {
    this.toggleShown()
  }

  onHide () {
    this.toggleShown()
  }

  onDelete () {
    console.log('deleting')
  }

  onCopy () {
    console.log('copying')
  }

  render () {
    let password = this.props.password
    return <tr className='passwordItem'>
      <td className='passwordOrigin'>{password.get('origin')}</td>
      <td className='passwordUsername'>{password.get('username')}</td>
      <td className='passwordPlaintext'>{'*'.repeat(password.get('encryptedPassword').length)}</td>
      <td className='passwordActions'>
      <span className='passwordAction fa fa-clipboard' title='Copy password to clipboard'
        onClick={this.onCopy.bind(this)}>
      </span>
      {
        this.state.shown
        ? <span className='passwordAction fa fa-eye-slash'
              title='Hide password'
              onClick={this.onHide.bind(this)}></span>
        : <span className='passwordAction fa fa-eye'
              title='Show password'
              onClick={this.onShow.bind(this)}></span>
      }
      <span className='passwordAction fa fa-trash' title='Delete password'
        onClick={this.onDelete.bind(this)}>
      </span>
      </td>
    </tr>
  }
}

PasswordItem.propTypes = {
  password: React.PropTypes.object
}

class AboutPasswords extends React.Component {
  constructor () {
    super()
    this.state = {
      passwordDetails: window.initPasswords ? Immutable.fromJS(window.initPasswords) : Immutable.List()
    }
    window.addEventListener(messages.PASSWORD_DETAILS_UPDATED, (e) => {
      if (e.detail) {
        this.setState({
          passwordDetails: Immutable.fromJS(e.detail)
        })
      }
    })
  }

  onClear () {
    console.log('clearing')
  }

  render () {
    return <div className='passwordsPage'>
      <h2 data-l10n-id='passwordsTitle'></h2>
      <div className='passwordsPageContent'>
        <table className='passwordsList'>
        <thead>
          <tr>
            <th data-l10n-id='passwordsSite'></th>
            <th data-l10n-id='passwordsUsername'></th>
            <th data-l10n-id='passwordsPassword'></th>
            <th data-l10n-id='passwordsActions'></th>
          </tr>
        </thead>
        <tbody>
          {this.state.passwordDetails.map(item =>
            <PasswordItem password={item} />)
          }
        </tbody>
        </table>
      </div>
      <div className='passwordsPageFooter'>
        <a href='#' data-l10n-id='clearPasswords'
          onClick={this.onClear.bind(this)}></a>
      </div>
    </div>
  }
}

module.exports = <AboutPasswords/>
