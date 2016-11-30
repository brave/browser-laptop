/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const messages = require('../constants/messages')
const Immutable = require('immutable')
const aboutActions = require('./aboutActions')

const ipc = window.chrome.ipcRenderer

require('../../less/about/passwords.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class SiteItem extends React.Component {
  constructor () {
    super()
    this.onDelete = this.onDelete.bind(this)
  }

  onDelete () {
    aboutActions.deletePasswordSite(this.props.site)
  }

  render () {
    return <tr className='passwordItem'>
      <td className='passwordActions'>
        <span className='passwordAction fa fa-times' title='Remove site'
          onClick={this.onDelete} />
      </td>
      <td className='passwordOrigin'>{this.props.site}</td>
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
      decrypted: null
    }
    this.onDelete = this.onDelete.bind(this)
    this.onCopy = this.onCopy.bind(this)
    this.onDecrypt = this.onDecrypt.bind(this)
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
    } else {
      this.decrypt(false)
    }
  }

  onDecrypt (e, details) {
    if (details.id !== this.props.id) {
      return
    }
    aboutActions.setClipboard(details.decrypted)
    this.setState({
      decrypted: details.decrypted
    })
  }

  componentDidMount () {
    ipc.on('decrypted-password', this.onDecrypt)
  }

  render () {
    const password = this.props.password
    return <tr className='passwordItem'>
      <td className='passwordActions'>
        <span className='passwordAction fa fa-times' title='Delete password'
          onClick={this.onDelete} />
      </td>
      <td className='passwordOrigin'>{password.get('origin')}</td>
      <td className='passwordUsername'>{password.get('username')}</td>
      <td className='passwordPlaintext'>
        {'*'.repeat(password.get('encryptedPassword').length)}
      </td>
      <td className='passwordActions'>
        <span className='passwordAction fa fa-clipboard' title='Copy password to clipboard'
          onClick={this.onCopy} />
      </td>
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
      passwordDetails: new Immutable.List(),
      disabledSiteDetails: new Immutable.Map()
    }
    this.onClear = this.onClear.bind(this)
    ipc.on(messages.PASSWORD_DETAILS_UPDATED, (e, detail) => {
      if (detail) {
        this.setState({
          passwordDetails: Immutable.fromJS(detail)
        })
      }
    })
    ipc.on(messages.PASSWORD_SITE_DETAILS_UPDATED, (e, detail) => {
      if (detail) {
        this.setState({
          disabledSiteDetails: Immutable.fromJS(detail)
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
      <h2 data-l10n-id='savedPasswords' />
      <div className='passwordsPageContent'>
        <table className='passwordsList'>
          <thead>
            <tr>
              <th />
              <th data-l10n-id='passwordsSite' />
              <th data-l10n-id='passwordsUsername' />
              <th data-l10n-id='passwordsPassword' />
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
            onClick={this.onClear} />
        </div>
      </div>
    </div>

    var savedSitesPage = this.isSitesEmpty
    ? null
    : <div>
      <h2 data-l10n-id='passwordSites' />
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
      <h1 data-l10n-id='passwordsTitle' />
      <div className='passwordInstructions' data-l10n-id='passwordDisableInstructions' />
      {
        this.isPasswordsEmpty && this.isSitesEmpty
          ? <div data-l10n-id='noPasswordsSaved' />
          : [savedPasswordsPage, savedSitesPage]
      }
    </div>
  }
}

module.exports = <AboutPasswords />
