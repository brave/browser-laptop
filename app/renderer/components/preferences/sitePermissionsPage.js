/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {StyleSheet, css} = require('aphrodite')

// Components
const ImmutableComponent = require('../immutableComponent')
const {DefaultSectionTitle} = require('../common/sectionTitle')
const BrowserButton = require('../common/browserButton')

// Actions
const appActions = require('../../../../js/actions/appActions')
const aboutActions = require('../../../../js/about/aboutActions')

// Style
const globalStyles = require('../styles/global')

class SitePermissionsPage extends ImmutableComponent {
  hasEntryForPermission (name) {
    return this.props.siteSettings.some((value) => {
      return value.get && this.props.names[name] ? this.props.names[name].includes(typeof value.get(name)) : false
    })
  }

  isPermissionsNonEmpty () {
    // Check whether there is at least one permission set
    return this.props.siteSettings.some((value) => {
      if (value && value.get) {
        for (let name in this.props.names) {
          const granted = value.get(name)
          if (this.props.names[name].includes(typeof granted)) {
            if (this.props.defaults) {
              return this.props.defaults.get(name) !== granted
            } else {
              return true
            }
          }
        }
      }
      return false
    })
  }

  deletePermission (name, hostPattern) {
    appActions.removeSiteSetting(hostPattern, name)
  }

  clearPermissions (name) {
    aboutActions.clearSiteSettings(name)
  }

  render () {
    return this.isPermissionsNonEmpty()
    ? <div id='sitePermissionsPage'>
      <DefaultSectionTitle data-l10n-id={this.props.defaults ? 'sitePermissionsExceptions' : 'sitePermissions'} />
      <ul className={css(styles.sitePermissions)}>
        {
          Object.keys(this.props.names).map((name) =>
            this.hasEntryForPermission(name)
            ? <li>
              <div>
                <span data-l10n-id={name} className={css(styles.sitePermissions__permissionName)} />
                <span className={css(styles.sitePermissions__clearAll)}>
                  (
                  <span className={css(styles.sitePermissions__clearAll__link)} data-l10n-id='clearAll'
                    onClick={this.clearPermissions.bind(this, name)} />
                  )
                </span>
              </div>
              <ul className={css(styles.sitePermissions__list)}>
                {
                  this.props.siteSettings.map((value, hostPattern) => {
                    if (!value.size) {
                      return null
                    }
                    const granted = value.get(name)
                    if (this.props.defaults &&
                        this.props.defaults.get(name) === granted &&
                        granted !== undefined) {
                      return null
                    }
                    let statusText = ''
                    let statusArgs
                    if (this.props.names[name].includes(typeof granted)) {
                      if (name === 'flash') {
                        if (granted === 1) {
                          // Flash is allowed just one time
                          statusText = 'allowOnce'
                        } else if (granted === false) {
                          // Flash installer is never intercepted
                          statusText = 'alwaysDeny'
                        } else {
                          // Show the number of days/hrs/min til expiration
                          statusText = 'flashAllowAlways'
                          statusArgs = {
                            time: new Date(granted).toLocaleString()
                          }
                        }
                      } else if (name === 'widevine') {
                        if (granted === 1) {
                          statusText = 'alwaysAllow'
                        } else if (granted === 0) {
                          statusText = 'allowOnce'
                        } else {
                          statusText = 'alwaysDeny'
                        }
                      } else if (name === 'noScript' && typeof granted === 'number') {
                        if (granted === 1) {
                          statusText = 'allowUntilRestart'
                        } else if (granted === 0) {
                          statusText = 'allowOnce'
                        }
                      } else if (typeof granted === 'string') {
                        statusText = granted
                      } else if (!this.props.defaults) {
                        statusText = granted ? 'alwaysAllow' : 'alwaysDeny'
                      } else {
                        statusText = granted ? 'on' : 'off'
                      }
                      return <div className={css(styles.sitePermissions__list__item)}>
                        <BrowserButton
                          iconOnly
                          iconClass={globalStyles.appIcons.remove}
                          size='1rem'
                          custom={styles.sitePermissions__list__item__button}
                          onClick={this.deletePermission.bind(this, name, hostPattern)}
                        />
                        <span>{hostPattern + ':'}</span>
                        <span className={css(styles.sitePermissions__list__item__status)}
                          data-l10n-id={statusText}
                          data-l10n-args={statusArgs ? JSON.stringify(statusArgs) : null} />
                      </div>
                    }
                    return null
                  })
                }
              </ul>
            </li>
            : null)
        }
      </ul>
    </div>
    : null
  }
}

const styles = StyleSheet.create({
  sitePermissions: {
    listStyle: 'none',
    margin: '20px'
  },

  sitePermissions__permissionName: {
    fontWeight: 600
  },

  sitePermissions__clearAll: {
    cursor: 'pointer',
    color: globalStyles.color.gray,
    textDecoration: 'underline',
    marginLeft: '.5ch'
  },

  sitePermissions__clearAll__link: {
    // override the global value
    color: globalStyles.color.gray
  },

  sitePermissions__list: {
    marginBottom: '1rem'
  },

  sitePermissions__list__item: {
    display: 'flex',
    alignItems: 'center',
    lineHeight: 1.4
  },

  sitePermissions__list__item__button: {
    marginRight: '.25rem',
    color: globalStyles.color.braveOrange,

    ':hover': {
      color: globalStyles.color.braveOrange
    }
  },

  sitePermissions__list__item__status: {
    marginLeft: '.5ch',
    fontStyle: 'italic'
  }
})

module.exports = SitePermissionsPage
