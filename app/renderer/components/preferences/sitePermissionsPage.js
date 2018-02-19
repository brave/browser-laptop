/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const {DefaultSectionTitle} = require('../common/sectionTitle')

// Actions
const aboutActions = require('../../../../js/about/aboutActions')

class SitePermissionsPage extends React.Component {
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
    aboutActions.removeSiteSetting(hostPattern, name)
  }

  clearPermissions (name) {
    aboutActions.clearSiteSettings(name)
  }

  render () {
    return this.isPermissionsNonEmpty()
    ? <div id='sitePermissionsPage'>
      <DefaultSectionTitle data-l10n-id={this.props.defaults ? 'sitePermissionsExceptions' : 'sitePermissions'} />
      <ul className='sitePermissions'>
        {
          Object.keys(this.props.names).map((name) =>
            this.hasEntryForPermission(name)
            ? <li>
              <div>
                <span data-l10n-id={name} className='permissionName' />
                <span className='clearAll'>
                  (
                  <span className='clearAllLink' data-l10n-id='clearAll'
                    onClick={this.clearPermissions.bind(this, name)} />
                  )
                </span>
              </div>
              <ul>
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
                      return <div className='permissionItem'>
                        <span className='fa fa-times permissionAction'
                          onClick={this.deletePermission.bind(this, name, hostPattern)} />
                        <span className='permissionHost'>{hostPattern + ': '}</span>
                        <span className='permissionStatus'
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

module.exports = SitePermissionsPage
