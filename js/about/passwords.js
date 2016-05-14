/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const messages = require('../constants/messages')
const Immutable = require('immutable')
const aboutActions = require('./aboutActions')

require('../../less/about/passwords.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class SiteItem extends React.Component {
  onDelete () {
    aboutActions.deletePasswordSite(this.props.site)
  }

  render () {
    return <tr className='passwordItem'>
      <td className='passwordOrigin'>{this.props.site}</td>
      <td className='passwordActions'>
        <span className='passwordAction fa fa-times' title='Remove site'
          onClick={this.onDelete.bind(this)}>
        </span>
      </td>
    </tr>
  }
}

SiteItem.propTypes = {
  site: React.PropTypes.string
}

class PasswordItem extends React.Component {
  constructor () {
    super()
    this.state = {
      decrypted: null,
      notification: null
    }
  }

  decrypt () {
    // Ask the main process to decrypt the password
    const password = this.props.password
    aboutActions.decryptPassword(password.get('encryptedPassword'),
                                 password.get('authTag'), password.get('iv'),
                                 this.props.id)
  }

  onDelete () {
    aboutActions.deletePassword(this.props.password.toJS())
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
    }, 700)
  }

  onDecrypt (e) {
    if (e.detail.id !== this.props.id) {
      return
    }
    e.stopPropagation()
    aboutActions.setClipboard(e.detail.decrypted)
    this.showNotification('Copied!')
    this.setState({
      decrypted: e.detail.decrypted
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
        {'*'.repeat(password.get('encryptedPassword').length)}
      </td>
      <td className='passwordActions'>
        <span className='passwordAction fa fa-clipboard' title='Copy password to clipboard'
          onClick={this.onCopy.bind(this)}>
        </span>
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
      passwordDetails: window.initPasswords ? Immutable.fromJS(window.initPasswords) : new Immutable.List(),
      disabledSiteDetails: window.initDisabledSites ? Immutable.fromJS(window.initDisabledSites) : new Immutable.Map()
    }
    window.addEventListener(messages.PASSWORD_DETAILS_UPDATED, (e) => {
      if (e.detail) {
        this.setState({
          passwordDetails: Immutable.fromJS(e.detail)
        })
      }
    })
    window.addEventListener(messages.PASSWORD_SITE_DETAILS_UPDATED, (e) => {
      if (e.detail) {
        this.setState({
          disabledSiteDetails: Immutable.fromJS(e.detail)
        })
      }
    })
  }

  onClear () {
    const msg = 'Are you sure you want to delete all saved passwords? ' +
      'This cannot be undone.'
    if (window.confirm(msg)) {
      aboutActions.clearPasswords()
    }
  }

  get isPasswordsEmpty () {
    return !this.state.passwordDetails || !this.state.passwordDetails.size
  }

  get isSitesEmpty () {
    return !this.state.disabledSiteDetails || !this.state.disabledSiteDetails.size
  }

  render () {
    let counter = 0

    var savedPasswordsPage = this.isPasswordsEmpty
    ? null
    : <div>
      <h2 data-l10n-id='savedPasswords'></h2>
      <div className='passwordsPageContent'>
        <table className='passwordsList'>
          <thead>
            <tr>
              <th data-l10n-id='passwordsSite'></th>
              <th data-l10n-id='passwordsUsername'></th>
              <th data-l10n-id='passwordsPassword'></th>
            </tr>
          </thead>
          <tbody>
          {
            this.state.passwordDetails.sort((a, b) => {
              return a.get('origin') > b.get('origin') ? 1 : -1
            }).map((item) =>
              <PasswordItem password={item} id={counter++} />)
          }
          </tbody>
        </table>
        <div className='passwordsPageFooter'>
          <span data-l10n-id='clearPasswords'
            onClick={this.onClear.bind(this)}></span>
        </div>
      </div>
    </div>

    var savedSitesPage = this.isSitesEmpty
    ? null
    : <div>
      <h2 data-l10n-id='passwordSites'></h2>
      <div className='passwordsPageContent'>
        <table className='passwordsList'>
          <tbody>
          {
            this.state.disabledSiteDetails.map((item, site) =>
              <SiteItem site={site} />)
          }
          </tbody>
        </table>
      </div>
    </div>

    return <div className='passwordsPage'>
      <h1 data-l10n-id='passwordsTitle'></h1>
      <div className='passwordInstructions' data-l10n-id='passwordDisableInstructions'></div>
      {
        this.isPasswordsEmpty && this.isSitesEmpty
          ? <div data-l10n-id='noPasswordsSaved'></div>
          : [savedPasswordsPage, savedSitesPage]
      }
    </div>
  }
}

module.exports = <AboutPasswords />
