/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

/* brave ledger integration for the brave browser

   module entry points:
     init()   - called by app/index.js   to start module
     quit()   -   ..   ..   ..     ..    prior to browser quitting
     boot()   -   ..   ..   ..      ..   to create wallet

   IPC entry point:
      LEDGER_PUBLISHER - called synchronously by app/extensions/brave/content/scripts/pageInformation.js
      CHANGE_SETTING - called asynchronously to record a settings change

   eventStore entry point:
      addChangeListener - called when tabs render or gain focus
 */

const fs = require('fs')
const path = require('path')
const url = require('url')
const util = require('util')

const electron = require('electron')
const app = electron.app
const ipc = electron.ipcMain
const session = electron.session

const acorn = require('acorn')
const ledgerBalance = require('ledger-balance')
const ledgerClient = require('ledger-client')
const ledgerGeoIP = require('ledger-geoip')
const ledgerPublisher = require('ledger-publisher')
const qr = require('qr-image')
const random = require('random-lib')
const tldjs = require('tldjs')
const underscore = require('underscore')
const uuid = require('node-uuid')

const appActions = require('../js/actions/appActions')
const appConstants = require('../js/constants/appConstants')
const appDispatcher = require('../js/dispatcher/appDispatcher')
const messages = require('../js/constants/messages')
const settings = require('../js/constants/settings')
const request = require('../js/lib/request')
const getSetting = require('../js/settings').getSetting
const locale = require('./locale')
const appStore = require('../js/stores/appStore')
const eventStore = require('../js/stores/eventStore')
const rulesolver = require('./extensions/brave/content/scripts/pageInformation.js')

// TBD: remove these post beta [MTR]
const logPath = 'ledger-log.json'
const publisherPath = 'ledger-publisher.json'
const scoresPath = 'ledger-scores.json'

// TBD: move these to secureState post beta [MTR]
const statePath = 'ledger-state.json'
const synopsisPath = 'ledger-synopsis.json'

/*
 * ledger globals
 */

var bootP = false
var client
const clientOptions = { debugP: process.env.LEDGER_DEBUG,
                        loggingP: process.env.LEDGER_LOGGING,
                        verboseP: process.env.LEDGER_VERBOSE
                      }

/*
 * publisher globals
 */

var synopsis
var locations = {}
var publishers = {}

/*
 * utility globals
 */

const msecs = { year: 365 * 24 * 60 * 60 * 1000,
                week: 7 * 24 * 60 * 60 * 1000,
                day: 24 * 60 * 60 * 1000,
                hour: 60 * 60 * 1000,
                minute: 60 * 1000,
                second: 1000
              }

/*
 * notification state globals
 */

let addFundsMessage
let reconciliationMessage
let suppressNotifications = false
let reconciliationNotificationShown = false
let notificationTimeout = null

// TODO(bridiver) - create a better way to get setting changes
const doAction = (action) => {
  switch (action.actionType) {
    case appConstants.APP_CHANGE_SETTING:
      if (action.key === settings.PAYMENTS_ENABLED) return initialize(action.value)
      if (action.key === settings.PAYMENTS_CONTRIBUTION_AMOUNT) return setPaymentInfo(action.value)
      break
    default:
  }
}

/*
 * module entry points
 */
var init = () => {
  try {
    ledgerInfo._internal.debugP = ledgerClient.prototype.boolion(process.env.LEDGER_CLIENT_DEBUG)
    publisherInfo._internal.debugP = ledgerClient.prototype.boolion(process.env.LEDGER_PUBLISHER_DEBUG)
    publisherInfo._internal.verboseP = ledgerClient.prototype.boolion(process.env.LEDGER_PUBLISHER_VERBOSE)

    appDispatcher.register(doAction)
    initialize(getSetting(settings.PAYMENTS_ENABLED))
  } catch (ex) { console.log('ledger.js initialization failed: ' + ex.toString() + '\n' + ex.stack) }
}

var quit = () => {
  visit('NOOP', underscore.now(), null)
}

var boot = () => {
  if ((bootP) || (client)) return

  bootP = true
  fs.access(pathName(statePath), fs.FF_OK, (err) => {
    if (!err) return

    if (err.code !== 'ENOENT') console.log('statePath read error: ' + err.toString())

    ledgerInfo.creating = true
    appActions.updateLedgerInfo({ creating: true })
    try {
      client = ledgerClient(null, underscore.extend({ roundtrip: roundtrip }, clientOptions), null)
    } catch (ex) {
      appActions.updateLedgerInfo({})

      bootP = false
      return console.log('ledger client boot error: ' + ex.toString() + '\n' + ex.stack)
    }
    if (client.sync(callback) === true) run(random.randomInt({ min: 1, max: 10 }) * msecs.minute)
    getBalance()

    bootP = false
  })
}

/*
 * IPC entry point
 */

if (ipc) {
  ipc.on(messages.CHECK_BITCOIN_HANDLER, (event, partition) => {
    const protocolHandler = session.fromPartition(partition).protocol
    // TODO: https://github.com/brave/browser-laptop/issues/3625
    if (typeof protocolHandler.isNavigatorProtocolHandled === 'function') {
      ledgerInfo.hasBitcoinHandler = protocolHandler.isNavigatorProtocolHandled('bitcoin')
      appActions.updateLedgerInfo(underscore.omit(ledgerInfo, [ '_internal' ]))
    }
  })

  ipc.on(messages.LEDGER_PUBLISHER, (event, location) => {
    var ctx

    if ((!synopsis) || (event.sender.session === session.fromPartition('default')) || (!tldjs.isValid(location))) {
      event.returnValue = {}
      return
    }

    ctx = url.parse(location, true)
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

    event.returnValue = { context: ctx, rules: publisherInfo._internal.ruleset.cooked }
  })

  ipc.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex) => {
    const win = electron.BrowserWindow.getFocusedWindow()
    if (message === addFundsMessage) {
      appActions.hideMessageBox(message)
      if (buttonIndex === 0) {
        // Don't show notifications for the next 6 hours.
        suppressNotifications = true
        setTimeout(() => { suppressNotifications = false }, 6 * msecs.hour)
      } else {
        // Open payments panel
        if (win) {
          win.webContents.send(messages.SHORTCUT_NEW_FRAME,
            'about:preferences#payments', { singleFrame: true })
        }
      }
    } else if (message === reconciliationMessage) {
      appActions.hideMessageBox(message)
      if (win) {
        win.webContents.send(messages.SHORTCUT_NEW_FRAME,
          'about:preferences#payments', { singleFrame: true })
      }
      // If > 24 hours has passed, it might be time to show the reconciliation
      // message again
      setTimeout(() => { reconciliationNotificationShown = false }, msecs.day)
    }
  })

  ipc.on(messages.ADD_FUNDS_CLOSED, () => {
    if (balanceTimeoutId) clearTimeout(balanceTimeoutId)
    balanceTimeoutId = setTimeout(getBalance, 5 * msecs.second)
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

eventStore.addChangeListener(() => {
  var view = eventStore.getState().toJS().page_view
  var info = eventStore.getState().toJS().page_info

  if ((!synopsis) || (!util.isArray(info))) return

  info.forEach((page) => {
    var entry, faviconURL, publisher
    var location = page.url

    if ((location.match(/^about/)) || ((locations[location]) && (locations[location].publisher))) return

    if (!page.publisher) {
      try {
        publisher = ledgerPublisher.getPublisher(location)
        if (publisher) page.publisher = publisher
      } catch (ex) {
        console.log('getPublisher error for ' + location + ': ' + ex.toString())
      }
    }
    locations[location] = underscore.omit(page, [ 'url' ])
    if (!page.publisher) return

    publisher = page.publisher
    synopsis.initPublisher(publisher)
    entry = synopsis.publishers[publisher]
    if ((page.protocol) && (!entry.protocol)) entry.protocol = page.protocol

    if ((typeof entry.faviconURL === 'undefined') && ((page.faviconURL) || (entry.protocol))) {
      var fetch = (url, redirects) => {
        if (typeof redirects === 'undefined') redirects = 0

        request.request({ url: url, responseType: 'blob' }, (err, response, blob) => {
          var matchP, prefix, tail

          if (publisherInfo._internal.debugP) {
            console.log('\nresponse: ' + url +
                        ' errP=' + (!!err) + ' blob=' + (blob || '').substr(0, 80) + '\nresponse=' +
                        JSON.stringify(response, null, 2))
          }

          if (err) return console.log('response error: ' + err.toString() + '\n' + err.stack)

          if ((response.statusCode === 301) && (response.headers.location)) {
            if (redirects < 3) fetch(response.headers.location, redirects++)
            return
          }

          if ((response.statusCode !== 200) || (response.headers['content-length'] === '0')) return

          if (blob.indexOf('data:image/') !== 0) {
            // NB: for some reason, some sites return an image, but with the wrong content-type...

            tail = blob.indexOf(';base64,')
            if (tail <= 0) return

            prefix = new Buffer(blob.substr(tail + 8, signatureMax), 'base64')
            underscore.keys(fileTypes).forEach((fileType) => {
              if (matchP) return
              if ((prefix.length < fileTypes[fileType].length) &&
                  (fileTypes[fileType].compare(prefix, 0, fileTypes[fileType].length) !== 0)) return

              blob = 'data:image/' + fileType + blob.substr(tail)
              matchP = true
            })
          }

          entry.faviconURL = blob
          updatePublisherInfo()
          if (publisherInfo._internal.debugP) {
            console.log('\n' + publisher + ' synopsis=' +
                        JSON.stringify(underscore.extend(underscore.omit(entry, [ 'faviconURL', 'window' ]),
                                                         { faviconURL: entry.faviconURL && '... ' }), null, 2))
          }
        })
      }

      faviconURL = page.faviconURL || entry.protocol + '//' + url.parse(location).host + '/favicon.ico'
      entry.faviconURL = null

      if (publisherInfo._internal.debugP) console.log('request: ' + faviconURL)
      fetch(faviconURL)
    }
  })

  view = underscore.last(view) || {}
  visit(view.url || 'NOOP', view.timestamp || underscore.now(), view.tabId)
})

/*
 * module initialization
 */

var initialize = (onoff) => {
  enable(onoff)

  if (!onoff) {
    client = null
    return appActions.updateLedgerInfo({})
  }
  if (client) return

  cacheRuleSet(ledgerPublisher.rules)

  fs.access(pathName(statePath), fs.FF_OK, (err) => {
    if (!err) {
      if (clientOptions.verboseP) console.log('\nfound ' + pathName(statePath))

      fs.readFile(pathName(statePath), (err, data) => {
        var state

        if (err) return console.log('read error: ' + err.toString())

        try {
          state = JSON.parse(data)
          if (clientOptions.verboseP) console.log('\nstarting up ledger client integration')
        } catch (ex) {
          return console.log('statePath parse error: ' + ex.toString())
        }

        getStateInfo(state)
        try {
          client = ledgerClient(state.personaId,
                                              underscore.extend(state.options, { roundtrip: roundtrip }, clientOptions), state)
        } catch (ex) {
          return console.log('ledger client creation error: ' + ex.toString() + '\n' + ex.stack)
        }
        if (client.sync(callback) === true) run(random.randomInt({ min: 1, max: 10 }) * msecs.minute)
        cacheRuleSet(state.ruleset)

        // Make sure bravery props are up-to-date with user settings
        setPaymentInfo(getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT))
        getBalance()
      })
      return
    }

    if (err.code !== 'ENOENT') console.log('statePath read error: ' + err.toString())
    appActions.updateLedgerInfo({})
  })
}

var enable = (onoff) => {
  if (!onoff) {
    synopsis = null
    if (notificationTimeout) {
      clearInterval(notificationTimeout)
      notificationTimeout = null
    }
    return updatePublisherInfo()
  }

  synopsis = new (ledgerPublisher.Synopsis)()
  fs.readFile(pathName(synopsisPath), (err, data) => {
    if (publisherInfo._internal.verboseP) console.log('\nstarting up ledger publisher integration')

    if (err) {
      if (err.code !== 'ENOENT') console.log('synopsisPath read error: ' + err.toString())
      return updatePublisherInfo()
    }

    if (publisherInfo._internal.verboseP) console.log('\nfound ' + pathName(synopsisPath))
    try {
      synopsis = new (ledgerPublisher.Synopsis)(data)
    } catch (ex) {
      console.log('synopsisPath parse error: ' + ex.toString())
    }
    if (process.env.NODE_ENV === 'test') synopsis.options.minDuration = 0
    underscore.keys(synopsis.publishers).forEach((publisher) => {
      if (synopsis.publishers[publisher].faviconURL === null) delete synopsis.publishers[publisher].faviconURL
    })
    updatePublisherInfo()

    // Check if relevant browser notifications should be shown every 15 minutes
    notificationTimeout = setInterval(showNotifications, msecs.minute * 15)

    fs.readFile(pathName(publisherPath), (err, data) => {
      if (err) {
        if (err.code !== 'ENOENT') console.log('publisherPath read error: ' + err.toString())
        return
      }

      if (publisherInfo._internal.verboseP) console.log('\nfound ' + pathName(publisherPath))
      try {
        data = JSON.parse(data)
        underscore.keys(data).sort().forEach((publisher) => {
          var entries = data[publisher]

          publishers[publisher] = {}
          entries.forEach((entry) => {
            locations[entry.location] = entry
            publishers[publisher][entry.location] = { timestamp: entry.when, tabIds: [] }
          })
        })
      } catch (ex) {
        console.log('publishersPath parse error: ' + ex.toString())
      }
    })
  })
}

/*
 * update publisher information
 */

var publisherInfo = {
  synopsis: undefined,

  _internal: {
    ruleset: { raw: [], cooked: [] }
  }
}

var updatePublisherInfo = () => {
  var data = {}
  var then = underscore.now() - msecs.week

  if (!synopsis) return

  underscore.keys(publishers).sort().forEach((publisher) => {
    var entries = []

    underscore.keys(publishers[publisher]).forEach((location) => {
      var when = publishers[publisher][location].timestamp

      if (when > then) entries.push({ location: location, when: when })
    })

    if (entries.length > 0) data[publisher] = entries
  })
  syncWriter(pathName(publisherPath), data, () => {})
  syncWriter(pathName(scoresPath), synopsis.allN(), () => {})

  syncWriter(pathName(synopsisPath), synopsis, () => {})
  publisherInfo.synopsis = synopsisNormalizer()

  if (publisherInfo._internal.debugP) {
    data = []
    publisherInfo.synopsis.forEach((entry) => {
      data.push(underscore.extend(underscore.omit(entry, [ 'faviconURL' ]), { faviconURL: entry.faviconURL && '...' }))
    })

    console.log('\nupdatePublisherInfo: ' + JSON.stringify(data, null, 2))
  }

  appActions.updatePublisherInfo(underscore.omit(publisherInfo, [ '_internal' ]))
}

var synopsisNormalizer = () => {
  var i, duration, n, pct, publisher, results, total
  var data = []
  var scorekeeper = synopsis.options.scorekeeper

  results = []
  underscore.keys(synopsis.publishers).forEach((publisher) => {
    if (synopsis.publishers[publisher].scores[scorekeeper] <= 0) return

    results.push(underscore.extend({ publisher: publisher }, underscore.omit(synopsis.publishers[publisher], 'window')))
  }, synopsis)
  results = underscore.sortBy(results, (entry) => { return -entry.scores[scorekeeper] })
  n = results.length

  total = 0
  for (i = 0; i < n; i++) { total += results[i].scores[scorekeeper] }
  if (total === 0) return data

  pct = []
  for (i = 0; i < n; i++) {
    publisher = synopsis.publishers[results[i].publisher]
    duration = results[i].duration

    data[i] = {
      rank: i + 1,
      // TBD: the `ledger-publisher` package does not currently report `verified` ...
      verified: publisher.verified || false,
      site: results[i].publisher,
      views: results[i].visits,
      duration: duration,
      daysSpent: 0,
      hoursSpent: 0,
      minutesSpent: 0,
      secondsSpent: 0,
      faviconURL: publisher.faviconURL,
      score: results[i].scores[scorekeeper]
    }
    if (results[i].protocol) data[i].publisherURL = results[i].protocol + '//' + results[i].publisher

    pct[i] = Math.round((results[i].scores[scorekeeper] * 100) / total)

    if (duration >= msecs.day) {
      data[i].daysSpent = Math.max(Math.round(duration / msecs.day), 1)
    } else if (duration >= msecs.hour) {
      data[i].hoursSpent = Math.max(Math.floor(duration / msecs.hour), 1)
      data[i].minutesSpent = Math.round((duration % msecs.hour) / msecs.minute)
    } else if (duration >= msecs.minute) {
      data[i].minutesSpent = Math.max(Math.round(duration / msecs.minute), 1)
      data[i].secondsSpent = Math.round((duration % msecs.minute) / msecs.second)
    } else {
      data[i].secondsSpent = Math.max(Math.round(duration / msecs.second), 1)
    }
  }

  // courtesy of https://stackoverflow.com/questions/13483430/how-to-make-rounded-percentages-add-up-to-100#13485888
  var foo = (l, target) => {
    var off = target - underscore.reduce(l, (acc, x) => { return acc + Math.round(x) }, 0)

    return underscore.chain(l)
                     .sortBy((x) => { return Math.round(x) - x })
                     .map((x, i) => { return Math.round(x) + (off > i) - (i >= (l.length + off)) })
                     .value()
  }

  pct = foo(pct, 100)
  total = 0
  for (i = 0; i < n; i++) {
/*
    if (pct[i] <= 0) {
      data = data.slice(0, i)
      break
    }
 */
    if (pct[i] < 0) pct[i] = 0

    data[i].percentage = pct[i]
    total += pct[i]
  }

  for (i = data.length - 1; (total > 100) && (i >= 0); i--) {
    if (data[i].percentage < 2) continue

    data[i].percentage--
    total--
  }

  return data
}

/*
 * publisher utilities
 */

var currentLocation = 'NOOP'
var currentTimestamp = underscore.now()

var visit = (location, timestamp, tabId) => {
  var setLocation = () => {
    var duration, publisher, revisitP

    if (!synopsis) return

    if (publisherInfo._internal.verboseP) {
      console.log('locations[' + currentLocation + ']=' + JSON.stringify(locations[currentLocation], null, 2) +
                  ' duration=' + (timestamp - currentTimestamp) + ' msec' + ' tabId=' + tabId)
    }
    if ((location === currentLocation) || (!locations[currentLocation]) || (!tabId)) return

    publisher = locations[currentLocation].publisher
    if (!publisher) return

    if (!publishers[publisher]) publishers[publisher] = {}
    if (!publishers[publisher][currentLocation]) publishers[publisher][currentLocation] = { tabIds: [] }
    publishers[publisher][currentLocation].timestamp = timestamp
    revisitP = publishers[publisher][currentLocation].tabIds.indexOf(tabId) !== -1
    if (!revisitP) publishers[publisher][currentLocation].tabIds.push(tabId)

    duration = timestamp - currentTimestamp
    if (publisherInfo._internal.verboseP) {
      console.log('\nadd publisher ' + publisher + ': ' + duration + ' msec' + ' revisitP=' + revisitP + ' state=' +
                  JSON.stringify(underscore.extend({ location: currentLocation }, publishers[publisher][currentLocation]),
                                 null, 2))
    }
    synopsis.addPublisher(publisher, { duration: duration, revisitP: revisitP })
    updatePublisherInfo()
  }

  setLocation()
  if (location === currentLocation) return

  currentLocation = location.match(/^about/) ? 'NOOP' : location
  currentTimestamp = timestamp
}

var cacheRuleSet = (ruleset) => {
  var stewed, syncP

  var prune = function (tree) {
    var result

    if (util.isArray(tree)) {
      result = []
      tree.forEach((branch) => { result.push(prune(branch)) })
      return result
    }

    if (typeof tree !== 'object') return tree

    tree = underscore.omit(tree, [ 'start', 'end', 'raw' ])
    result = {}
    underscore.keys(tree).forEach((key) => { result[key] = prune(tree[key]) })
    return result
  }

  if ((!ruleset) || (underscore.isEqual(publisherInfo._internal.ruleset.raw, ruleset))) return

  try {
    stewed = []
    ruleset.forEach((rule) => {
      var entry = { condition: acorn.parse(rule.condition) }

      if (rule.dom) {
        if (rule.dom.publisher) {
          entry.publisher = { selector: rule.dom.publisher.nodeSelector,
                              consequent: acorn.parse(rule.dom.publisher.consequent)
                            }
        }
        if (rule.dom.faviconURL) {
          entry.faviconURL = { selector: rule.dom.faviconURL.nodeSelector,
                               consequent: acorn.parse(rule.dom.faviconURL.consequent)
                             }
        }
      }
      if (!entry.publisher) entry.consequent = rule.consequent ? acorn.parse(rule.consequent) : rule.consequent

      stewed.push(entry)
    })

    publisherInfo._internal.ruleset.raw = ruleset
    publisherInfo._internal.ruleset.cooked = stewed
    if (!synopsis) return

    underscore.keys(synopsis.publishers).forEach((publisher) => {
      var location = (synopsis.publishers[publisher].protocol || 'http:') + '//' + publisher
      var ctx = url.parse(location, true)

      ctx.TLD = tldjs.getPublicSuffix(ctx.host)
      if (!ctx.TLD) return

      ctx = underscore.mapObject(ctx, function (value, key) { if (!underscore.isFunction(value)) return value })
      ctx.URL = location
      ctx.SLD = tldjs.getDomain(ctx.host)
      ctx.RLD = tldjs.getSubdomain(ctx.host)
      ctx.QLD = ctx.RLD ? underscore.last(ctx.RLD.split('.')) : ''

      stewed.forEach((rule) => {
        if ((rule.consequent !== null) || (rule.dom)) return
        if (!rulesolver.resolve(rule.condition, ctx)) return

        if (publisherInfo._internal.verboseP) console.log('\npurging ' + publisher)
        delete synopsis.publishers[publisher]
        syncP = true
      })
    })
    if (!syncP) return

    updatePublisherInfo()
  } catch (ex) {
    console.log('ruleset error: ' + ex.toString() + '\n' + ex.stack)
  }
}

/*
 * update ledger information
 */

var ledgerInfo = {
  creating: false,
  created: false,

  delayStamp: undefined,
  reconcileStamp: undefined,
  reconcileDelay: undefined,

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

var updateLedgerInfo = () => {
  var info = ledgerInfo._internal.paymentInfo
  var now = underscore.now()

  if (info) {
    underscore.extend(ledgerInfo,
                      underscore.pick(info, [ 'address', 'balance', 'unconfirmed', 'satoshis', 'btc', 'amount', 'currency' ]))
    if ((!info.buyURLExpires) || (info.buyURLExpires > now)) ledgerInfo.buyURL = info.buyURL
    underscore.extend(ledgerInfo, ledgerInfo._internal.cache || {})
  }

  if ((client) && (now > ledgerInfo._internal.geoipExpiry)) {
    ledgerInfo._internal.geoipExpiry = now + (5 * msecs.minute)
    return ledgerGeoIP.getGeoIP(client.options, (err, provider, result) => {
      if (err) console.log('ledger geoip warning: ' + JSON.stringify(err, null, 2))
      if (result) ledgerInfo.countryCode = result

      ledgerInfo.exchangeInfo = ledgerInfo._internal.exchanges[ledgerInfo.countryCode]

      if (now <= ledgerInfo._internal.exchangeExpiry) return updateLedgerInfo()

      ledgerInfo._internal.exchangeExpiry = now + msecs.day
      roundtrip({ path: '/v1/exchange/providers' }, client.options, (err, response, body) => {
        if (err) console.log('ledger exchange error: ' + JSON.stringify(err, null, 2))

        ledgerInfo._internal.exchanges = body || {}
        ledgerInfo.exchangeInfo = ledgerInfo._internal.exchanges[ledgerInfo.countryCode]
        updateLedgerInfo()
      })
    })
  }

  if (ledgerInfo._internal.debugP) {
    console.log('\nupdateLedgerInfo: ' + JSON.stringify(underscore.omit(ledgerInfo, [ '_internal' ]), null, 2))
  }

  appActions.updateLedgerInfo(underscore.omit(ledgerInfo, [ '_internal' ]))
}

/*
 * ledger client callbacks
 */

var logs = []

var callback = (err, result, delayTime) => {
  var i, then
  var entries = client && client.report()
  var now = underscore.now()

  if (clientOptions.verboseP) {
    console.log('\nledger client callback: clientP=' + (!!client) + ' errP=' + (!!err) + ' resultP=' + (!!result) +
                ' delayTime=' + delayTime)
  }

  if (entries) {
    then = now - msecs.week
    logs = logs.concat(entries)

    for (i = 0; i < logs.length; i++) if (logs[i].when > then) break
    if ((i !== 0) && (i !== logs.length)) logs = logs.slice(i)
    if (result) entries.push({ who: 'callback', what: result, when: underscore.now() })

    syncWriter(pathName(logPath), entries, { flag: 'a' }, () => {})
  }

  if (err) {
    console.log('ledger client error(1): ' + JSON.stringify(err, null, 2) + (err.stack ? ('\n' + err.stack) : ''))
    if (!client) return

    if (typeof delayTime === 'undefined') delayTime = random.randomInt({ min: 1 * msecs.minute, max: 10 * msecs.minute })
  }

  if (!result) return run(delayTime)

  if ((client) && (result.properties.wallet)) {
    if (!ledgerInfo.created) setPaymentInfo(getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT))

    getStateInfo(result)
    getPaymentInfo()
  }
  cacheRuleSet(result.ruleset)

  syncWriter(pathName(statePath), result, () => { run(delayTime) })
}

var roundtrip = (params, options, callback) => {
  var i
  var parts = typeof params.server === 'string' ? url.parse(params.server)
                : typeof params.server !== 'undefined' ? params.server
                : typeof options.server === 'string' ? url.parse(options.server) : options.server

  if (!params.method) params.method = 'GET'
  parts = underscore.extend(underscore.pick(parts, [ 'protocol', 'hostname', 'port' ]),
                            underscore.omit(params, [ 'headers', 'payload', 'timeout' ]))

// TBD: let the user configure this via preferences [MTR]
  if ((parts.hostname === 'ledger.brave.com') && (params.useProxy)) parts.hostname = 'ledger-proxy.privateinternetaccess.com'

  i = parts.path.indexOf('?')
  if (i !== -1) {
    parts.pathname = parts.path.substring(0, i)
    parts.search = parts.path.substring(i)
  } else {
    parts.pathname = parts.path
  }

  options = {
    url: url.format(parts),
    method: params.method,
    payload: params.payload,
    responseType: 'text',
    headers: underscore.defaults(params.headers || {}, { 'content-type': 'application/json; charset=utf-8' }),
    verboseP: options.verboseP
  }
  request.request(options, (err, response, body) => {
    var payload

    if ((response) && (options.verboseP)) {
      console.log('[ response for ' + params.method + ' ' + parts.protocol + '//' + parts.hostname + params.path + ' ]')
      console.log('>>> HTTP/' + response.httpVersionMajor + '.' + response.httpVersionMinor + ' ' + response.statusCode +
                 ' ' + (response.statusMessage || ''))
      underscore.keys(response.headers).forEach((header) => { console.log('>>> ' + header + ': ' + response.headers[header]) })
      console.log('>>>')
      console.log('>>> ' + (body || '').split('\n').join('\n>>> '))
    }

    if (err) return callback(err)

    if (Math.floor(response.statusCode / 100) !== 2) {
      return callback(new Error('HTTP response ' + response.statusCode) + ' for ' + params.method + ' ' + params.path)
    }

    try {
      payload = (response.statusCode !== 204) ? JSON.parse(body) : null
    } catch (err) {
      return callback(err)
    }

    try {
      callback(null, response, payload)
    } catch (err0) {
      if (options.verboseP) console.log('\ncallback: ' + err0.toString() + '\n' + err0.stack)
    }
  })

  if (!options.verboseP) return

  console.log('<<< ' + params.method + ' ' + parts.protocol + '//' + parts.hostname + params.path)
  underscore.keys(options.headers).forEach((header) => { console.log('<<< ' + header + ': ' + options.headers[header]) })
  console.log('<<<')
  if (options.payload) console.log('<<< ' + JSON.stringify(params.payload, null, 2).split('\n').join('\n<<< '))
}

var runTimeoutId = false

var run = (delayTime) => {
//  if (clientOptions.verboseP) console.log('\nledger client run: clientP=' + (!!client) + ' delayTime=' + delayTime)

  if ((typeof delayTime === 'undefined') || (!client)) return

  var active, state
  var ballots = client.ballots()
  var siteSettings = appStore.getState().get('siteSettings')
  var winners = ((synopsis) && (ballots > 0) && (synopsis.winners(ballots))) || []

  try {
    winners.forEach((winner) => {
      var result
      var siteSetting = siteSettings.get(`https?://${winner}`)

      if ((siteSetting) && (siteSetting.get('ledgerPayments') === false)) return

      result = client.vote(winner)
      if (result) state = result
    })
    if (state) syncWriter(pathName(statePath), state, () => {})
  } catch (ex) {
    console.log('ledger client error(2): ' + ex.toString() + (ex.stack ? ('\n' + ex.stack) : ''))
  }

  if (delayTime === 0) {
    try {
      delayTime = client.timeUntilReconcile()
    } catch (ex) {
      delayTime = false
    }
    if (delayTime === false) delayTime = random.randomInt({ min: 1, max: 10 }) * msecs.minute
  }
  if (delayTime > 0) {
    if (runTimeoutId) return console.log('\ninterception')

    active = client
    if (delayTime > msecs.day) delayTime = msecs.day

    runTimeoutId = setTimeout(() => {
      runTimeoutId = false
      if (active !== client) return

      if (!client) return console.log('\n\n*** MTR says this can\'t happen(1)... please tell him that he\'s wrong!\n\n')

      if (client.sync(callback) === true) return run(0)
    }, delayTime)
    return
  }

  if (client.isReadyToReconcile()) return client.reconcile(uuid.v4().toLowerCase(), callback)

  console.log('what? wait, how can this happen?')
}

/*
 * ledger client utilities
 */

var getStateInfo = (state) => {
  var ballots, i, transaction
  var info = state.paymentInfo
  var then = underscore.now() - msecs.year

  ledgerInfo.created = !!state.properties.wallet
  ledgerInfo.creating = !ledgerInfo.created

  ledgerInfo.delayStamp = state.delayStamp
  ledgerInfo.reconcileStamp = state.reconcileStamp
  ledgerInfo.reconcileDelay = state.prepareTransaction && state.delayStamp

  if (info) {
    ledgerInfo._internal.paymentInfo = info
    cacheReturnValue()
  }

  ledgerInfo.transactions = []
  if (!state.transactions) return updateLedgerInfo()

  for (i = state.transactions.length - 1; i >= 0; i--) {
    transaction = state.transactions[i]
    if (transaction.stamp < then) break

    ballots = underscore.clone(transaction.ballots || {})
    state.ballots.forEach((ballot) => {
      if (ballot.viewingId !== transaction.viewingId) return

      if (!ballots[ballot.publisher]) ballots[ballot.publisher] = 0
      ballots[ballot.publisher]++
    })

    ledgerInfo.transactions.push(underscore.extend(underscore.pick(transaction,
                                                                   [ 'viewingId', 'contribution', 'submissionStamp', 'count' ]),
                                                                   { ballots: ballots }))
  }

  updateLedgerInfo()
}

var balanceTimeoutId = false

var getBalance = () => {
  if (!client) return

  balanceTimeoutId = setTimeout(getBalance, msecs.minute)
  if (!ledgerInfo.address) return

  ledgerBalance.getBalance(ledgerInfo.address, underscore.extend({ balancesP: true }, client.options),
  (err, provider, result) => {
    var unconfirmed
    var info = ledgerInfo._internal.paymentInfo

    if (err) return console.log('ledger balance warning: ' + JSON.stringify(err, null, 2))

    if (typeof result.unconfirmed === 'undefined') return

    if (result.unconfirmed > 0) {
      unconfirmed = (result.unconfirmed / 1e8).toFixed(4)
      if ((info || ledgerInfo).unconfirmed === unconfirmed) return

      ledgerInfo.unconfirmed = unconfirmed
      if (info) info.unconfirmed = ledgerInfo.unconfirmed
      if (clientOptions.verboseP) console.log('\ngetBalance refreshes ledger info: ' + ledgerInfo.unconfirmed)
      return updateLedgerInfo()
    }

    if (ledgerInfo.unconfirmed === '0.0000') return

    if (clientOptions.verboseP) console.log('\ngetBalance refreshes payment info')
    getPaymentInfo()
  })
}

var logError = (err, caller) => {
  if (err) {
    ledgerInfo.error = {
      caller: caller,
      error: err
    }
    console.log('Error in %j: %j', caller, err)
    return true
  } else {
    ledgerInfo.error = null
    return false
  }
}

var getPaymentInfo = () => {
  var amount, currency

  if (!client) return

  try {
    ledgerInfo.bravery = client.getBraveryProperties()
    if (ledgerInfo.bravery.fee) {
      amount = ledgerInfo.bravery.fee.amount
      currency = ledgerInfo.bravery.fee.currency
    }

    client.getWalletProperties(amount, currency, function (err, body) {
      var info = ledgerInfo._internal.paymentInfo || {}

      if (logError(err, 'getWalletProperties')) {
        return
      }

      info = underscore.extend(info, underscore.pick(body, [ 'buyURL', 'buyURLExpires', 'balance', 'unconfirmed', 'satoshis' ]))
      info.address = client.getWalletAddress()
      if ((amount) && (currency)) {
        info = underscore.extend(info, { amount: amount, currency: currency })
        if ((body.rates) && (body.rates[currency])) {
          info.btc = (amount / body.rates[currency]).toFixed(8)
        }
      }
      ledgerInfo._internal.paymentInfo = info
      updateLedgerInfo()
      cacheReturnValue()
    })
  } catch (ex) {
    console.log('properties error: ' + ex.toString())
  }
}

var setPaymentInfo = (amount) => {
  if (!client) return

  var bravery = client.getBraveryProperties()

  amount = parseInt(amount, 10)
  if (isNaN(amount) || (amount <= 0)) return

  underscore.extend(bravery.fee, { amount: amount })
  client.setBraveryProperties(bravery, (err, result) => {
    if (err) return console.log('ledger setBraveryProperties: ' + err.toString())

    if (result) syncWriter(pathName(statePath), result, () => {})
  })
  if (ledgerInfo.created) getPaymentInfo()
}

var cacheReturnValue = () => {
  var chunks, cache, paymentURL
  var info = ledgerInfo._internal.paymentInfo

  if (!info) return

  if (!ledgerInfo._internal.cache) ledgerInfo._internal.cache = {}
  cache = ledgerInfo._internal.cache

  paymentURL = 'bitcoin:' + info.address + '?amount=' + info.btc + '&label=' + encodeURI('Brave Software')
  if (cache.paymentURL === paymentURL) return

  cache.paymentURL = paymentURL
  updateLedgerInfo()
  try {
    chunks = []

    qr.image(paymentURL, { type: 'png' }).on('data', (chunk) => { chunks.push(chunk) }).on('end', () => {
      cache.paymentIMG = 'data:image/png;base64,' + Buffer.concat(chunks).toString('base64')
      updateLedgerInfo()
    })
  } catch (ex) {
    console.log('qr.imageSync error: ' + ex.toString())
  }
}

/*
 * low-level utilities
 */

var syncP = {}

var syncWriter = (path, obj, options, cb) => {
  if (syncP[path]) return
  syncP[path] = true

  if (typeof options === 'function') {
    cb = options
    options = null
  }
  options = underscore.defaults(options || {}, { encoding: 'utf8', mode: parseInt('644', 8) })

  fs.writeFile(path, JSON.stringify(obj, null, 2), options, (err) => {
    syncP[path] = false

    if (err) console.log('write error: ' + err.toString())

    cb(err)
  })
}

const pathSuffix = { development: '-dev', test: '-test' }[process.env.NODE_ENV] || ''

var pathName = (name) => {
  var parts = path.parse(name)
  var basePath = process.env.NODE_ENV === 'test'
    ? path.join(process.env.HOME, '.brave-test-ledger')
    : app.getPath('userData')

  return path.join(basePath, parts.name + pathSuffix + parts.ext)
}

/**
 * UI controller functionality
 */

/**
 * Show message that it's time to add funds if reconciliation is less than
 * a day in the future and balance is too low.
 * 24 hours prior to reconciliation, show message asking user to review
 * their votes.
 */
const showNotifications = () => {
  if (!getSetting(settings.PAYMENTS_ENABLED) ||
      !getSetting(settings.PAYMENTS_NOTIFICATIONS) || suppressNotifications) {
    return
  }
  const reconcileStamp = ledgerInfo.reconcileStamp
  const balance = Number(ledgerInfo.balance || 0)
  const unconfirmed = Number(ledgerInfo.unconfirmed || 0)

  if (reconcileStamp && reconcileStamp - underscore.now() < msecs.day) {
    if (ledgerInfo.btc &&
        balance + unconfirmed < 0.9 * Number(ledgerInfo.btc)) {
      addFundsMessage = addFundsMessage || locale.translation('addFundsNotification')
      appActions.showMessageBox({
        greeting: locale.translation('updateHello'),
        message: addFundsMessage,
        buttons: [
          {text: locale.translation('updateLater')},
          {text: locale.translation('addFunds'), className: 'primary'}
        ],
        options: {
          style: 'greetingStyle',
          persist: false
        }
      })
    } else if (!reconciliationNotificationShown) {
      reconciliationMessage = reconciliationMessage || locale.translation('reconciliationNotification')
      appActions.showMessageBox({
        greeting: locale.translation('updateHello'),
        message: reconciliationMessage,
        buttons: [
          {text: locale.translation('reviewSites'), className: 'primary'}
        ],
        options: {
          style: 'greetingStyle',
          persist: false
        }
      })
      reconciliationNotificationShown = true
    }
  }
}

module.exports = {
  init: init,
  quit: quit,
  boot: boot
}
