/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const messages = require('../js/constants/messages')
const electron = require('electron')
const session = electron.session
const BrowserWindow = electron.BrowserWindow
const AppStore = require('../js/stores/appStore')
const AppConfig = require('../js/constants/appConfig')
const urlParse = require('url').parse
const getBaseDomain = require('../js/lib/baseDomain').getBaseDomain
const getSetting = require('../js/settings').getSetting
const settings = require('../js/constants/settings')

const filteringFns = []

// Third party domains that require a valid referer to work
const refererExceptions = ['use.typekit.net']

module.exports.registerFilteringCB = filteringFn => {
  filteringFns.push(filteringFn)
}

/**
 * Register for notifications for webRequest notifications for
 * a particular session.
 * @param {object} The session to add webRequest filtering on
 */
function registerForSession (session) {
  // For efficiency, avoid calculating sendDNT on every request. This means the
  // browser must be restarted for changes to take effect.
  const sendDNT = getSetting(AppStore.getState().get('settings'), settings.DO_NOT_TRACK)
  session.webRequest.onBeforeSendHeaders(function (details, cb) {
    // Using an electron binary which isn't from Brave
    if (!details.firstPartyUrl) {
      cb({})
      return
    }

    let results
    for (let i = 0; i < filteringFns.length; i++) {
      let currentResults = filteringFns[i](details)
      if (currentResults && !module.exports.isResourceEnabled(currentResults.resourceName)) {
        continue
      }
      results = currentResults
      if (results.shouldBlock) {
        break
      }
    }

    let requestHeaders = details.requestHeaders
    let hostname = urlParse(details.url || '').hostname
    if (module.exports.isResourceEnabled(AppConfig.resourceNames.COOKIEBLOCK) &&
        module.exports.isThirdPartyHost(urlParse(details.firstPartyUrl || '').hostname,
                                        hostname)) {
      // Clear cookie and referer on third-party requests
      if (requestHeaders['Cookie']) {
        requestHeaders['Cookie'] = undefined
      }
      if (requestHeaders['Referer']) {
        requestHeaders['Referer'] = refererExceptions.includes(hostname) ? 'http://localhost' : undefined
      }
    }
    if (sendDNT) {
      requestHeaders['DNT'] = '1'
    }

    if (!results || !results.shouldBlock) {
      cb({requestHeaders: requestHeaders})
    } else if (results.shouldBlock) {
      // We have no good way of knowing which BrowserWindow the blocking is for
      // yet so send it everywhere and let listeners decide how to respond.
      BrowserWindow.getAllWindows().forEach(wnd =>
        wnd.webContents.send(messages.BLOCKED_RESOURCE, results.resourceName, details))
      cb({
        requestHeaders: requestHeaders,
        cancel: true
      })
    }
  })
}

module.exports.isThirdPartyHost = (baseContextHost, testHost) => {
  // TODO: Always return true if these are IP addresses that aren't the same
  if (!testHost || !baseContextHost) {
    return true
  }
  const documentDomain = getBaseDomain(baseContextHost)
  if (testHost.length > documentDomain.length) {
    return (testHost.substr(testHost.length - documentDomain.length - 1) !== '.' + documentDomain)
  } else {
    return (testHost !== documentDomain)
  }
}

module.exports.init = () => {
  registerForSession(session.fromPartition(''))
  registerForSession(session.fromPartition('private-1'))
  registerForSession(session.fromPartition('main-1'))
}

module.exports.isResourceEnabled = (resourceName) => {
  const enabledFromState = AppStore.getState().getIn([resourceName, 'enabled'])
  if (enabledFromState === undefined) {
    return AppConfig[resourceName].enabled
  }
  return enabledFromState
}
