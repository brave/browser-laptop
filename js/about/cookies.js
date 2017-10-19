/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const SortableTable = require('../../app/renderer/components/common/sortableTable')
const aboutActions = require('./aboutActions')
const messages = require('../constants/messages')
const moment = require('moment')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../app/renderer/components/styles/global')

const BrowserButton = require('../../app/renderer/components/common/browserButton')
const {
  SectionTitleWrapper,
  AboutPageSectionTitle
} = require('../../app/renderer/components/common/sectionTitle')

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
    return <section className={css(styles.cookiesPage)}>
      <div className={css(styles.cookiesPage__header)}>
        <SectionTitleWrapper>
          <AboutPageSectionTitle data-l10n-id='cookiesTitle' />
          <BrowserButton
            iconOnly
            iconClass={globalStyles.appIcons.moreInfo}
            size='16px'
            custom={styles.cookiesPage__header__info}
            onClick={
              aboutActions.createTabRequested.bind(null, {
                url: INFO_URL
              })
            }
          />
        </SectionTitleWrapper>
        {
          this.isCookiesEmpty
            ? null
            : <span className={css(styles.cookiesPage__header__clearCookiesLink)}
              data-l10n-id='clearCookies'
              onClick={aboutActions.removeCookies.bind(null, null)}
            />
        }
      </div>
      {
        this.isCookiesEmpty
          ? <div data-l10n-id='noCookiesSaved' />
          : this.cookiesTable
      }
    </section>
  }
}

const styles = StyleSheet.create({
  cookiesPage: {
    userSelect: 'none',
    margin: '20px'
  },

  cookiesPage__header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  cookiesPage__header__info: {
    marginLeft: '.5rem',
    cursor: 'pointer'
  },

  cookiesPage__header__clearCookiesLink: {
    color: 'grey',
    cursor: 'pointer',
    textDecoration: 'underline',

    // Add the same margin-bottom as sectionTitleWrapper (See sectionTitle.js)
    marginBottom: '.7rem'
  },

  cookieColumn: {
    maxWidth: '250px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
})

module.exports = <AboutCookies />
