/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const SortableTable = require('../../app/renderer/components/common/sortableTable')
const aboutActions = require('./aboutActions')
const messages = require('../constants/messages')
const moment = require('moment')

const {StyleSheet, css} = require('aphrodite/no-important')

require('../../less/about/common.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

const ipc = window.chrome.ipcRenderer

const COOKIE_FIELDS = ['domain', 'name', 'value', 'path', 'expirationDate', 'secure', 'httpOnly', 'session', 'hostOnly', 'partition'] // TODO: add the sameSite field
const INFO_URL = 'https://developer.chrome.com/extensions/cookies#type-Cookie'

class AboutCookies extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      cookies: []
    }
    ipc.on(messages.COOKIES_UPDATED, (e, cookies) => {
      const allCookies = []
      for (let partition in cookies) {
        cookies[partition].forEach((cookie) => {
          cookie.partition = partition
          allCookies.push(cookie)
        })
      }
      this.setState({
        cookies: allCookies
      })
    })
  }

  get isCookiesEmpty () {
    return this.state.cookies.length === 0
  }

  get cookiesTable () {
    return <SortableTable
      fillAvailable
      className={css(styles.cookieTable)}
      headings={COOKIE_FIELDS}
      defaultHeading='domain'
      addHoverClass
      multiSelect
      contextMenuName='cookies'
      onContextMenu={aboutActions.contextMenu}
      onDelete={aboutActions.removeCookies}
      rowObjects={this.state.cookies}
      rows={this.state.cookies.map((cookie) => {
        return COOKIE_FIELDS.map((fieldName) => {
          const value = cookie[fieldName]
          let displayValue = value
          if (typeof value === 'number' && fieldName === 'expirationDate') {
            displayValue = moment.unix(value).format('YYYY-MM-DD HH:mm:ss Z')
          } else if (value === null || value === undefined) {
            displayValue = ''
          }
          return {
            value,
            html: <div title={displayValue} className={css(styles.cookieColumn)}>{displayValue}</div>
          }
        })
      })}
    />
  }

  componentDidMount () {
    window.addEventListener('load', () => {
      const th = document.querySelector('th')
      if (th) { th.click() }
    })
  }

  render () {
    return <div className={css(styles.cookiesPage)}>
      <div className={css(styles.cookiesTitleWrapper)}>
        <h1 data-l10n-id='cookiesTitle' className={css(styles.cookiesTitle)} />
        <span className='fa fa-info-circle infoCircle' onClick={
          aboutActions.createTabRequested.bind(null, {
            url: INFO_URL
          })
        } />
        {
          this.isCookiesEmpty
            ? null
            : <span className={css(styles.clearCookiesLink)}
              data-l10n-id='clearCookies'
              onClick={aboutActions.removeCookies.bind(null, null)} />
        }
      </div>
      {
        this.isCookiesEmpty
          ? <div data-l10n-id='noCookiesSaved' />
          : this.cookiesTable
      }
    </div>
  }
}

const styles = StyleSheet.create({
  cookiesPage: {
    userSelect: 'none',
    margin: '20px'
  },
  clearCookiesLink: {
    color: 'grey',
    cursor: 'pointer',
    marginTop: '5px',
    float: 'right',
    textDecoration: 'underline'
  },
  cookiesTitle: {
    display: 'inline',
    userSelect: 'text',
    marginRight: '10px'
  },
  cookiesTitleWrapper: {
    marginBottom: '20px'
  },
  cookieTable: {
    width: '100%'
  },
  cookieColumn: {
    maxWidth: '350px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
})

module.exports = <AboutCookies />
