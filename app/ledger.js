/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

/* brave ledger integration for the brave browser

   module entry points:
     init()   - called by app/index.js   to start module
     quit()   -   ..   ..   ..     ..    prior to browser quitting
     boot()   -   ..   ..   ..     ..    to create wallet
     reset()  -   ..   ..   ..     ..    to remove state

   IPC entry point:
      LEDGER_PUBLISHER  - called synchronously by app/extensions/brave/content/scripts/pageInformation.js
      CHANGE_SETTING    - called asynchronously to record a settings change

   eventStore entry point:
      addChangeListener - called when tabs render or gain focus
 */

/* internal terminology:

   blockedP: the user has selected 'Never include this site' (site setting 'ledgerPaymentsShown')
    stickyP: the user has toggled ON the button to the right of the address bar (site setting 'ledgerPayments')
   excluded: the publisher appears on the list of sites to exclude from automatic inclusion (if auto-include is enabled)

  eligibleP: the current scorekeeper says the publisher has received enough durable visits
   visibleP: (stickyP OR (!excluded AND eligibleP)) AND !blockedP
contributeP: (stickyP OR !excluded) AND eligibleP   AND !blockedP
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const urlParse = require('./common/urlParse')
const urlFormat = require('url').format
const Immutable = require('immutable')

const electron = require('electron')
const app = electron.app
const ipc = electron.ipcMain
const session = electron.session

const acorn = require('acorn')
const levelup = require('level')
const moment = require('moment')
const qr = require('qr-image')
const querystring = require('querystring')
const random = require('random-lib')
const tldjs = require('tldjs')
const underscore = require('underscore')
const uuid = require('uuid')

const appActions = require('../js/actions/appActions')
const appConfig = require('../js/constants/appConfig')
const messages = require('../js/constants/messages')
const settings = require('../js/constants/settings')
const request = require('../js/lib/request')
const getSetting = require('../js/settings').getSetting
const locale = require('./locale')
const appStore = require('../js/stores/appStore')
const rulesolver = require('./extensions/brave/content/scripts/pageInformation')
const ledgerUtil = require('./common/lib/ledgerUtil')
const tabs = require('./browser/tabs')
const pageDataState = require('./common/state/pageDataState')

// "only-when-needed" loading...
let ledgerBalance = null
let ledgerClient = null
let ledgerGeoIP = null
let ledgerPublisher = null

// testing data


// TBD: remove these post beta [MTR]
// TODO remove, it's not used anymore
const logPath = 'ledger-log.json'
const publisherPath = 'ledger-publisher.json'
const scoresPath = 'ledger-scores.json'

// TBD: move these to secureState post beta [MTR]
const synopsisPath = 'ledger-synopsis.json'

/*
 * ledger globals
 */

var bootP = false
var client
const clientOptions = {
  debugP: process.env.LEDGER_DEBUG,
  loggingP: process.env.LEDGER_LOGGING,
  rulesTestP: process.env.LEDGER_RULES_TESTING,
  verboseP: process.env.LEDGER_VERBOSE,
  server: process.env.LEDGER_SERVER_URL,
  createWorker: app.createWorker
}
var quitP

/*
 * publisher globals
 */

var synopsis
var locations = {}
var publishers = {}

/*
 * utility globals
 */

/*
 * notification state globals
 */

let addFundsMessage
let reconciliationMessage
let notificationPaymentDoneMessage
let notificationTryPaymentsMessage
let notificationTimeout = null


/*
 * module entry points
 */


var boot = () => {
  if ((bootP) || (client)) return

  bootP = true
  fs.access(pathName(statePath), fs.FF_OK, (err) => {
    if (!err) return

    if (err.code !== 'ENOENT') console.error('statePath read error: ' + err.toString())

    ledgerInfo.creating = true
    appActions.updateLedgerInfo({ creating: true })
    try {
      clientprep()
      client = ledgerClient(null, underscore.extend({ roundtrip: roundtrip }, clientOptions), null)
    } catch (ex) {
      appActions.updateLedgerInfo({})

      bootP = false
      return console.error('ledger client boot error: ', ex)
    }
    if (client.sync(callback) === true) run(random.randomInt({ min: miliseconds.minute, max: 10 * miliseconds.minute }))
    getBalance()

    bootP = false
  })
}

/*
 * Print or Save Recovery Keys
 */


/*
 * Recover Ledger Keys
 */

/*
 * IPC entry point
 */

if (ipc) {
  ipc.on(messages.LEDGER_CREATE_WALLET, () => {
    boot()
  })

  let ledgerPaymentsPresent = {}
  // TODO(bridiver) - convert this to an action
  process.on(messages.LEDGER_PAYMENTS_PRESENT, (tabId, presentP) => {
    if (presentP) {
      ledgerPaymentsPresent[tabId] = presentP
    } else {
      delete ledgerPaymentsPresent[tabId]
    }

    if (Object.keys(ledgerPaymentsPresent).length > 0 && getSetting(settings.PAYMENTS_ENABLED)) {
      if (!balanceTimeoutId) getBalance()
    } else if (balanceTimeoutId) {
      clearTimeout(balanceTimeoutId)
      balanceTimeoutId = false
    }
  })

  ipc.on(messages.LEDGER_PUBLISHER, (event, location) => {
    var ctx

    if ((!synopsis) || (event.sender.session === session.fromPartition('default')) || (!tldjs.isValid(location))) {
      event.returnValue = {}
      return
    }

    ctx = urlParse(location, true)
    ctx.TLD = tldjs.getPublicSuffix(ctx.host)
    if (!ctx.TLD) {
      if (publisherInfo._internal.verboseP) console.log('\nno TLD for:' + ctx.host)
      event.returnValue = {}
      return
    }

    ctx = underscore.mapObject(ctx, function (value, key) { if (!underscore.isFunction(value)) return value })
    ctx.URL = location
    ctx.SLD = tldjs.getDomain(ctx.host)
    ctx.RLD = tldjs.getSubdomain(ctx.host)
    ctx.QLD = ctx.RLD ? underscore.last(ctx.RLD.split('.')) : ''

    if (!event.sender.isDestroyed()) {
      event.sender.send(messages.LEDGER_PUBLISHER_RESPONSE + '-' + location, { context: ctx, rules: publisherInfo._internal.ruleset.cooked })
    }
  })

  ipc.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex) => {
    const win = electron.BrowserWindow.getActiveWindow()
    if (message === locale.translation('addFundsNotification')) {
      appActions.hideNotification(message)
      // See showNotificationAddFunds() for buttons.
      // buttonIndex === 1 is "Later"; the timestamp until which to delay is set
      // in showNotificationAddFunds() when triggering this notification.
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      } else if (buttonIndex === 2 && win) {
        // Add funds: Open payments panel
        appActions.createTabRequested({
          url: 'about:preferences#payments',
          windowId: win.id
        })
      }
    } else if (message === locale.translation('reconciliationNotification')) {
      appActions.hideNotification(message)
      // buttonIndex === 1 is Dismiss
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      } else if (buttonIndex === 2 && win) {
        appActions.createTabRequested({
          url: 'about:preferences#payments',
          windowId: win.id
        })
      }
    } else if (message === notificationPaymentDoneMessage) {
      appActions.hideNotification(message)
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      }
    } else if (message === locale.translation('notificationTryPayments')) {
      appActions.hideNotification(message)
      if (buttonIndex === 1 && win) {
        appActions.createTabRequested({
          url: 'about:preferences#payments',
          windowId: win.id
        })
      }
      appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED, true)
    }
  })

  ipc.on(messages.ADD_FUNDS_CLOSED, () => {
    if (balanceTimeoutId) clearTimeout(balanceTimeoutId)
    balanceTimeoutId = setTimeout(getBalance, 5 * milisecons.second)
  })
}

/*
 * eventStore entry point
 */

var fileTypes = {
  bmp: new Buffer([ 0x42, 0x4d ]),
  gif: new Buffer([ 0x47, 0x49, 0x46, 0x38, [0x37, 0x39], 0x61 ]),
  ico: new Buffer([ 0x00, 0x00, 0x01, 0x00 ]),
  jpeg: new Buffer([ 0xff, 0xd8, 0xff ]),
  png: new Buffer([ 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a ])
}

var signatureMax = 0
underscore.keys(fileTypes).forEach((fileType) => {
  if (signatureMax < fileTypes[fileType].length) signatureMax = fileTypes[fileType].length
})
signatureMax = Math.ceil(signatureMax * 1.5)

/*
 * module initialization
 */

/*
 * update location information
 */

var updateLocationInfo = (location) => {
  appActions.updateLocationInfo(locations)
}

var updateLocation = (location, publisher) => {
  var updateP

  if (typeof locations[location].stickyP === 'undefined') locations[location].stickyP = stickyP(publisher)
  if (typeof locations[location].verified !== 'undefined') return

  if (synopsis && synopsis.publishers[publisher] && (typeof synopsis.publishers[publisher].options.verified !== 'undefined')) {
    locations[location].verified = synopsis.publishers[publisher].options.verified || false
    updateP = true
  } else {
    verifiedP(publisher, (err, result) => {
      if ((err) && (!err.notFound)) return

      locations[location].verified = (result && result.verified) || false
      updateLocationInfo(location)
    })
  }

  if (synopsis && synopsis.publishers[publisher] && (typeof synopsis.publishers[publisher].options.exclude !== 'undefined')) {
    locations[location].exclude = synopsis.publishers[publisher].options.exclude || false
    updateP = true
  } else {
    excludeP(publisher, (err, result) => {
      if ((err) && (!err.notFound)) return

      locations[location].exclude = (result && result.exclude) || false
      updateLocationInfo(location)
    })
  }

  if (updateP) updateLocationInfo(location)
}

const getFavIcon = (publisher, page, location) => {
  if ((page.protocol) && (!publisher.protocol)) {
    publisher.protocol = page.protocol
  }

  if ((typeof publisher.faviconURL === 'undefined') && ((page.faviconURL) || (publisher.protocol))) {
    let faviconURL = page.faviconURL || publisher.protocol + '//' + urlParse(location).host + '/favicon.ico'
    if (publisherInfo._internal.debugP) {
      console.log('\nrequest: ' + faviconURL)
    }

    publisher.faviconURL = null
    fetchFavIcon(publisher, faviconURL)
  }
}

const fetchFavIcon = (publisher, url, redirects) => {
  if (typeof redirects === 'undefined') redirects = 0

  request.request({ url: url, responseType: 'blob' }, (err, response, blob) => {
    let matchP, prefix, tail

    if ((response) && (publisherInfo._internal.verboseP)) {
      console.log('[ response for ' + url + ' ]')
      console.log('>>> HTTP/' + response.httpVersionMajor + '.' + response.httpVersionMinor + ' ' + response.statusCode +
        ' ' + (response.statusMessage || ''))
      underscore.keys(response.headers).forEach((header) => { console.log('>>> ' + header + ': ' + response.headers[header]) })
      console.log('>>>')
      console.log('>>> ' + (blob || '').substr(0, 80))
    }

    if (publisherInfo._internal.debugP) {
      console.log('\nresponse: ' + url +
        ' errP=' + (!!err) + ' blob=' + (blob || '').substr(0, 80) + '\nresponse=' +
        JSON.stringify(response, null, 2))
    }

    if (err) {
      console.error('response error: ' + err.toString() + '\n' + err.stack)
      return null
    }

    if ((response.statusCode === 301) && (response.headers.location)) {
      if (redirects < 3) fetchFavIcon(publisher, response.headers.location, redirects++)
      return null
    }

    if ((response.statusCode !== 200) || (response.headers['content-length'] === '0')) {
      return null
    }

    tail = blob.indexOf(';base64,')
    if (blob.indexOf('data:image/') !== 0) {
      // NB: for some reason, some sites return an image, but with the wrong content-type...
      if (tail <= 0) {
        return null
      }

      prefix = new Buffer(blob.substr(tail + 8, signatureMax), 'base64')
      underscore.keys(fileTypes).forEach((fileType) => {
        if (matchP) return
        if ((prefix.length >= fileTypes[fileType].length) ||
          (fileTypes[fileType].compare(prefix, 0, fileTypes[fileType].length) !== 0)) return

        blob = 'data:image/' + fileType + blob.substr(tail)
        matchP = true
      })
      if (!matchP) {
        return
      }
    } else if ((tail > 0) && (tail + 8 >= blob.length)) return

    if (publisherInfo._internal.debugP) {
      console.log('\n' + publisher.site + ' synopsis=' +
        JSON.stringify(underscore.extend(underscore.omit(publisher, [ 'faviconURL', 'window' ]),
          { faviconURL: publisher.faviconURL && '... ' }), null, 2))
    }

    publisher.faviconURL = blob
    updatePublisherInfo()
  })
}


/*
 * publisher utilities
 */

/*
 * update ledger information
 */

var ledgerInfo = {
  creating: false,
  created: false,

  reconcileFrequency: undefined,
  reconcileStamp: undefined,

  transactions:
  [
/*
    {
      viewingId: undefined,
      surveyorId: undefined,
      contribution: {
        fiat: {
          amount: undefined,
          currency: undefined
        },
        rates: {
          [currency]: undefined // bitcoin value in <currency>
        },
        satoshis: undefined,
        fee: undefined
      },
      submissionStamp: undefined,
      submissionId: undefined,
      count: undefined,
      satoshis: undefined,
      votes: undefined,
      ballots: {
        [publisher]: undefined
      }
  , ...
 */
  ],

  // set from ledger client's state.paymentInfo OR client's getWalletProperties
  // Bitcoin wallet address
  address: undefined,

  // Bitcoin wallet balance (truncated BTC and satoshis)
  balance: undefined,
  unconfirmed: undefined,
  satoshis: undefined,

  // the desired contribution (the btc value approximates the amount/currency designation)
  btc: undefined,
  amount: undefined,
  currency: undefined,

  paymentURL: undefined,
  buyURL: undefined,
  bravery: undefined,

  // wallet credentials
  paymentId: undefined,
  passphrase: undefined,

  // advanced ledger settings
  minPublisherDuration: undefined,
  minPublisherVisits: undefined,
  showOnlyVerified: undefined,

  hasBitcoinHandler: false,

  // geoIP/exchange information
  countryCode: undefined,
  exchangeInfo: undefined,

  _internal: {
    exchangeExpiry: 0,
    exchanges: {},
    geoipExpiry: 0
  },
  error: null
}

/*
 * ledger client callbacks
 */

/*
 * low-level utilities
 */



module.exports = {
  init: init,
  recoverKeys: recoverKeys,
  backupKeys: backupKeys,
  quit: quit,
  boot: boot,
  reset: reset,
  doAction
}
