/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const PropTypes = require('prop-types')
const messages = require('../constants/messages')
const Immutable = require('immutable')
const aboutActions = require('./aboutActions')

const ipc = window.chrome.ipcRenderer

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../app/renderer/components/styles/global')

require('../../less/about/common.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class PasswordsTh extends React.Component {
  render () {
    return <th className={css(styles.passwordsTh)} {...this.props} />
  }
}

class PasswordsTr extends React.Component {
  render () {
    const className = css(
      styles.passwordsTr,
      this.props['data-isHead'] && styles.isHead
    )

    return <tr className={className} {...this.props} />
  }
}

class HeadTr extends React.Component {
  render () {
    return <PasswordsTr data-isHead='true' {...this.props} />
  }
}

class PasswordsTd extends React.Component {
  render () {
    const className = css(
      styles.passwordsTd,
      this.props['data-isAction'] && styles.isAction
    )

    return <td className={className} {...this.props} />
  }
}

class ActionsTd extends React.Component {
  render () {
    return <PasswordsTd data-isAction='true' {...this.props} />
  }
}

class SiteItem extends React.Component {
  constructor () {
    super()
    this.onDelete = this.onDelete.bind(this)
  }

  onDelete () {
    aboutActions.deletePasswordSite(this.props.site)
  }

  render () {
    return <PasswordsTr data-test-id='passwordItem'>
      <ActionsTd>
        <span className={css(styles.passwordAction)}>
          <span className={globalStyles.appIcons.remove}
            data-test-id='passwordAction'
            title='Remove site'
            onClick={this.onDelete}
            style={{backgroundColor: 'inherit'}} />
        </span>
      </ActionsTd>
      <PasswordsTd data-test-id='passwordOrigin'>{this.props.site}</PasswordsTd>
    </PasswordsTr>
  }
}

SiteItem.propTypes = {
  site: PropTypes.string
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
    return <PasswordsTr data-test-id='passwordItem'>
      <ActionsTd data-test-id='passwordActions'>
        <span className={css(styles.passwordAction)}>
          <span className={globalStyles.appIcons.remove}
            data-test-id='passwordAction'
            title='Delete password'
            onClick={this.onDelete}
            style={{backgroundColor: 'inherit'}} />
        </span>
      </ActionsTd>
      <PasswordsTd data-test-id='passwordOrigin'>{password.get('origin')}</PasswordsTd>
      <PasswordsTd data-test-id='passwordUsername'>{password.get('username')}</PasswordsTd>
      <PasswordsTd data-test-id='passwordPlaintext'>
        {'*'.repeat(password.get('encryptedPassword').length)}
      </PasswordsTd>
      <ActionsTd data-test-id='passwordActions'>
        <span className={css(styles.passwordAction)}>
          <span className={globalStyles.appIcons.clipboard}
            data-test-id='passwordAction'
            title='Copy password to clipboard'
            onClick={this.onCopy}
            style={{backgroundColor: 'inherit'}} />
        </span>
      </ActionsTd>
    </PasswordsTr>
  }
}

PasswordItem.propTypes = {
  password: PropTypes.object,
  id: PropTypes.number
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
      <div className={css(styles.passwordsPageContent)}>
        <table className={css(styles.passwordsList)}>
          <thead>
            <HeadTr>
              <PasswordsTh />
              <PasswordsTh data-l10n-id='passwordsSite' />
              <PasswordsTh data-l10n-id='passwordsUsername' />
              <PasswordsTh data-l10n-id='passwordsPassword' />
            </HeadTr>
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
        <div className={css(styles.passwordsPageFooter)}>
          <span className={css(styles.passwordsPageFooterClear)}
            data-test-id='passwordsPageFooterClear'
            data-l10n-id='clearPasswords'
            onClick={this.onClear} />
        </div>
      </div>
    </div>

    var savedSitesPage = this.isSitesEmpty
    ? null
    : <div>
      <h2 data-l10n-id='passwordSites' />
      <div className={css(styles.passwordsPageContent)}>
        <table className={css(styles.passwordsList)}>
          <tbody>
            {
              this.state.disabledSiteDetails.map((item, site) =>
                <SiteItem site={site} />)
            }
          </tbody>
        </table>
      </div>
    </div>

    return <div className={css(styles.passwordsPage)}>
      <h1 data-l10n-id='passwordsTitle' />
      <div className={css(styles.passwordInstructions)} data-l10n-id='passwordDisableInstructions' />
      {
        this.isPasswordsEmpty && this.isSitesEmpty
          ? <div data-l10n-id='noPasswordsSaved' />
          : [savedPasswordsPage, savedSitesPage]
      }
    </div>
  }
}

const itemPadding = '8px'

const styles = StyleSheet.create({
  passwordAction: {
    cursor: 'pointer',
    padding: itemPadding,

    // lighten(@highlightBlue, 20%);
    ':hover': {
      backgroundColor: '#9cd4fe'
    }
  },
  passwordsPage: {
    margin: '20px'
  },
  passwordsPageContent: {
    borderTop: `1px solid ${globalStyles.color.chromeBorderColor}`
  },
  passwordsList: {
    paddingTop: '10px',
    overflow: 'hidden'
  },
  passwordInstructions: {
    borderTop: `1px solid ${globalStyles.color.chromeBorderColor}`,
    paddingTop: '10px',
    paddingBottom: '20px',
    fontSize: '18px',
    color: 'grey'
  },
  passwordsPageFooter: {
    padding: '10px',
    marginBottom: '20px'
  },
  passwordsPageFooterClear: {
    color: 'grey',
    cursor: 'pointer',
    textDecoration: 'underline'
  },

  passwordsTh: {
    padding: itemPadding,
    textAlign: 'left'
  },
  passwordsTr: {
    cursor: 'default',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    padding: '12px',
    userSelect: 'none',

    // lighten(@highlightBlue, 30%);
    ':hover': {
      backgroundColor: '#ceeaff'
    }
  },
  isHead: {
    ':hover': {
      backgroundColor: 'inherit'
    }
  },
  passwordsTd: {
    padding: itemPadding
  },
  isAction: {
    padding: 0
  }
})

module.exports = <AboutPasswords />
