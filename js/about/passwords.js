/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const messages = require('../constants/messages')
const Immutable = require('immutable')
const aboutActions = require('./aboutActions')

require('../../less/about/passwords.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class PasswordItem extends React.Component {
  constructor () {
    super()
    this.state = {
      shown: false,
      decrypted: null,
      showAfterDecrypting: false,
      notification: null
    }
  }

  decrypt (showAfterDecrypting) {
    // Ask the main process to decrypt the password
    const password = this.props.password
    aboutActions.decryptPassword(password.get('encryptedPassword'),
                                 password.get('authTag'), password.get('iv'),
                                 this.props.id)
    this.setState({
      showAfterDecrypting
    })
  }

  onShow () {
    if (this.state.decrypted !== null) {
      this.setState({
        shown: true
      })
    } else {
      this.decrypt(true)
    }
  }

  onHide () {
    this.setState({
      shown: false,
      decrypted: null
    })
  }

  onDelete () {
    aboutActions.deletePassword(this.props.password)
  }

  onCopy () {
    if (this.state.decrypted !== null) {
      aboutActions.setClipboard(this.state.decrypted)
      this.showNotification('Copied!')
    } else {
      this.decrypt(false)
    }
  }

  showNotification (text) {
    // Shows a notification message for a few seconds
    this.setState({
      notification: text
    })
    window.setTimeout(() => {
      this.setState({
        notification: null
      })
    }, 1000)
  }

  onDecrypt (e) {
    if (e.detail.id !== this.props.id) {
      return
    }
    e.stopPropagation()
    if (!this.state.showAfterDecrypting) {
      // If we aren't showing the password, the only reason to decrypt
      // is to copy it to the clipboard
      aboutActions.setClipboard(e.detail.decrypted)
      this.showNotification('Copied!')
    }
    this.setState({
      decrypted: e.detail.decrypted,
      shown: this.state.showAfterDecrypting,
      showAfterDecrypting: false
    })
  }

  componentDidMount () {
    window.addEventListener('decrypted-password', this.onDecrypt.bind(this))
  }

  render () {
    const password = this.props.password
    return <tr className='passwordItem'>
      <td className='passwordOrigin'>{password.get('origin')}</td>
      <td className='passwordUsername'>{password.get('username')}</td>
      <td className='passwordPlaintext'>
        {this.state.shown ? this.state.decrypted : '*'.repeat(password.get('encryptedPassword').length)}
      </td>
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
      {
        this.state.notification
        ? <td className='passwordNotifications'>{this.state.notification}</td>
        : null
      }
    </tr>
  }
}

PasswordItem.propTypes = {
  password: React.PropTypes.object,
  id: React.PropTypes.number
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
    aboutActions.clearPasswords()
  }

  render () {
    let counter = 0
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
            <PasswordItem password={item} id={counter++}/>)
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
