/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

/* brave ledger integration for the brave browser

   module entry points:
     init()   - called by app/index.js   to start module
     quit()   -   ..   ..   ..     ..    prior to browser quitting
     enable() - called by Payments panel for on/off
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
const protocolHandler = electron.protocol
const session = electron.session

const acorn = require('acorn')
const ledgerPublisher = require('ledger-publisher')
const qr = require('qr-image')
const random = require('random-lib')
const tldjs = require('tldjs')
const underscore = require('underscore')
const uuid = require('node-uuid')

const appActions = require('../js/actions/appActions')
const messages = require('../js/constants/messages')
const settings = require('../js/constants/settings')
const request = require('../js/lib/request')
const getSetting = require('../js/settings').getSetting
const locale = require('./locale')
const appStore = require('../js/stores/appStore')
const eventStore = require('../js/stores/eventStore')
const rulesolver = require('./extensions/brave/content/scripts/pageInformation.js')

// TBD: remove these post beta [MTR]
const logPath = path.join(app.getPath('userData'), 'ledger-log.json')
const publisherPath = path.join(app.getPath('userData'), 'ledger-publisher.json')
const scoresPath = path.join(app.getPath('userData'), 'ledger-scores.json')

// TBD: move these to secureState post beta [MTR]
const statePath = path.join(app.getPath('userData'), 'ledger-state.json')
const synopsisPath = path.join(app.getPath('userData'), 'ledger-synopsis.json')

/*
 * ledger globals
 */

var client
const clientOptions = { loggingP: true, verboseP: true }

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
let suppressNotifications = false
let notificationTimeout = null

/*
 * module entry points
 */

var init = () => {
  try {
    initialize()
  } catch (ex) { console.log('initialization failed: ' + ex.toString() + '\n' + ex.stack) }
}

var quit = () => {
  visit('NOOP', underscore.now())
}

var enable = (onoff) => {
  if (!onoff) {
    synopsis = null
    if (notificationTimeout) {
      clearInterval(notificationTimeout)
      notificationTimeout = null
    }
    return updateLedgerInfo()
  }

  synopsis = new (ledgerPublisher.Synopsis)()
  fs.readFile(synopsisPath, (err, data) => {
    console.log('\nstarting up ledger publisher integration')

    if (err) {
      if (err.code !== 'ENOENT') console.log('synopsisPath read error: ' + err.toString())
      return updateLedgerInfo()
    }

    console.log('found ' + synopsisPath)
    try {
      synopsis = new (ledgerPublisher.Synopsis)(data)
    } catch (ex) {
      console.log('synopsisPath parse error: ' + ex.toString())
    }
    underscore.keys(synopsis.publishers).forEach((publisher) => {
      if (synopsis.publishers[publisher].faviconURL === null) delete synopsis.publishers[publisher].faviconURL
    })
    updateLedgerInfo()

    // Check if the add funds notification should be shown every 15 minutes
    notificationTimeout = setInterval(notifyAddFunds, msecs.minute * 15)

    fs.readFile(publisherPath, (err, data) => {
      if (err) {
        if (err.code !== 'ENOENT') console.log('publisherPath read error: ' + err.toString())
        return
      }

      console.log('found ' + publisherPath)
      try {
        data = JSON.parse(data)
        underscore.keys(data).sort().forEach((publisher) => {
          var entries = data[publisher]

          publishers[publisher] = {}
          entries.forEach((entry) => {
            locations[entry.location] = entry
            publishers[publisher][entry.location] = entry.when
          })
        })
      } catch (ex) {
        console.log('publishersPath parse error: ' + ex.toString())
      }
    })
  })
}

var boot = () => {
  if (client) return

  fs.access(statePath, fs.FF_OK, (err) => {
    if (!err) return

    if (err.code !== 'ENOENT') console.log('statePath read error: ' + err.toString())

    client = (require('ledger-client'))(null, underscore.extend(clientOptions, { roundtrip: roundtrip }), null)
    if (client.sync(callback) === true) run(random.randomInt({ min: 0, max: 10 * msecs.minute }))
  })
}

/*
 * IPC entry point
 */

if (ipc) {
  ipc.on(messages.LEDGER_PUBLISHER, (event, location) => {
    var ctx

    if ((!synopsis) || (event.sender.session === session.fromPartition('default')) || (!tldjs.isValid(location))) {
      event.returnValue = {}
      return
    }

    ctx = url.parse(location, true)
    ctx.TLD = tldjs.getPublicSuffix(ctx.host)
    if (!ctx.TLD) {
      console.log('no TLD for:' + ctx.host)
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

  ipc.on(messages.CHANGE_SETTING, (event, key, value) => {
    if (!client) return

    if (key === settings.PAYMENTS_CONTRIBUTION_AMOUNT) setPaymentInfo(value)
  })

  ipc.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex) => {
    if (message === addFundsMessage) {
      appActions.hideMessageBox(message)
      if (buttonIndex === 0) {
        // Don't show notifications for the next 6 hours.
        suppressNotifications = true
        setTimeout(() => { suppressNotifications = false }, 6 * msecs.hour)
      } else {
        // Open payments panel
        let win = electron.BrowserWindow.getFocusedWindow()
        if (win) {
          win.webContents.send(messages.SHORTCUT_NEW_FRAME,
            'about:preferences#publishers', { singleFrame: true })
        }
      }
    }
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

/*
    console.log('\npage=' + JSON.stringify(page, null, 2))
 */
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

/*
          console.log('\nresponse: ' + url +
                      ' errP=' + (!!err) + ' blob=' + (blob || '').substr(0, 80) + '\nresponse=' +
                      JSON.stringify(response, null, 2))
 */

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
          console.log('\n' + publisher + ' synopsis=' +
                      JSON.stringify(underscore.extend(underscore.omit(entry, [ 'faviconURL', 'window' ]),
                                                       { faviconURL: entry.faviconURL && '... ' }), null, 2))
        })
      }

      faviconURL = page.faviconURL || entry.protocol + '//' + url.parse(location).host + '/favicon.ico'
      entry.faviconURL = null

      console.log('request: ' + faviconURL)
      fetch(faviconURL)
    }
  })

  view = underscore.last(view) || {}
  visit(view.url || 'NOOP', view.timestamp || underscore.now())
})

/*
 * module initialization
 */

var initialize = () => {
  enable(getSetting(settings.PAYMENTS_ENABLED))

  cacheRuleSet(ledgerPublisher.rules)

  fs.access(statePath, fs.FF_OK, (err) => {
    if (!err) {
      console.log('found ' + statePath)

      fs.readFile(statePath, (err, data) => {
        var state

        if (err) return console.log('read error: ' + err.toString())

        try {
          state = JSON.parse(data)
          console.log('\nstarting up ledger client integration')
        } catch (ex) {
          return console.log('statePath parse error: ' + ex.toString())
        }

        getStateInfo(state)
        client = (require('ledger-client'))(state.personaId,
                                            underscore.defaults(underscore.extend(state.options, { roundtrip: roundtrip }),
                                                                clientOptions), state)
        if (client.sync(callback) === true) {
          run(random.randomInt({ min: 0, max: (state.options.debugP ? 5 * msecs.second : 1 * msecs.minute) }))
        }
        cacheRuleSet(state.ruleset)

        // Make sure bravery props are up-to-date with user settings
        setPaymentInfo(getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT))
        if (state.properties.wallet) getPaymentInfo()
      })
      return
    }
    if (err.code !== 'ENOENT') console.log('statePath read error: ' + err.toString())
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
      var when = publishers[publisher][location]
      if (when > then) entries.push({ location: location, when: when })
    })

    if (entries.length > 0) data[publisher] = entries
  })
  syncWriter(publisherPath, data, () => {})
  syncWriter(scoresPath, synopsis.allN(), () => {})

  syncWriter(synopsisPath, synopsis, () => {})
  publisherInfo.synopsis = synopsisNormalizer()

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

    data[i] = { rank: i + 1,
                // TBD: the `ledger-publisher` package does not currently report `verified` ...
                verified: publisher.verified || false,
                site: results[i].publisher, views: results[i].visits, duration: duration,
                daysSpent: 0, hoursSpent: 0, minutesSpent: 0, secondsSpent: 0,
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

var visit = (location, timestamp) => {
  var setLocation = () => {
    var duration, publisher

    if (!synopsis) return

/*
    console.log('locations[' + currentLocation + ']=' + JSON.stringify(locations[currentLocation], null, 2))
 */
    if ((location === currentLocation) || (!locations[currentLocation])) return

    publisher = locations[currentLocation].publisher
    if (!publisher) return

    if (!publishers[publisher]) publishers[publisher] = {}
    publishers[publisher][currentLocation] = timestamp

    duration = timestamp - currentTimestamp
    synopsis.addPublisher(publisher, duration)
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

        console.log('\npurging ' + publisher)
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
    { viewingId       : undefined
    , submissionStamp : undefined
    , satoshis        : undefined
    , currency        : undefined
    , amount          : undefined
    , ballots         :
      { 'publisher1'  : undefined
        ...
      }
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

  _internal: {}
}

var updateLedgerInfo = () => {
  var info = ledgerInfo._internal.paymentInfo
  var now = underscore.now()

  if (!client) return

  if (info) {
    underscore.extend(ledgerInfo,
                      underscore.pick(info, [ 'address', 'balance', 'unconfirmed', 'satoshis', 'btc', 'amount', 'currency' ]))
    if ((!info.buyURLExpires) || (info.buyURLExpires > now)) ledgerInfo.buyURL = info.buyURL
    underscore.extend(ledgerInfo, ledgerInfo._internal.cache || {})

    if (typeof protocolHandler.isNavigatorProtocolHandled === 'function') {
/* YAN: this comment is temporary until the preferences panel for payments can handle only one of these properties defined
      delete ledgerInfo[protocolHandler.isNavigatorProtocolHandled('', 'bitcoin') ? 'buyURL' : 'paymentURL']
 */
    }
  }

/*
  console.log(JSON.stringify(underscore.omit(ledgerInfo, [ '_internal' ]), null, 2))
 */

  appActions.updateLedgerInfo(underscore.omit(ledgerInfo, [ '_internal' ]))
}

/*
 * ledger client callbacks
 */

var logs = []

var callback = (err, result, delayTime) => {
  var i, then
  var entries = client.report()
  var now = underscore.now()

  console.log('\nledger client callback: errP=' + (!!err) + ' resultP=' + (!!result) + ' delayTime=' + delayTime)

  if (entries) {
    then = now - msecs.week
    logs = logs.concat(entries)

    for (i = 0; i < logs.length; i++) if (logs[i].when > then) break
    if ((i !== 0) && (i !== logs.length)) logs = logs.slice(i)
    if (result) entries.push({ who: 'callback', what: result, when: underscore.now() })

    syncWriter(logPath, entries, { flag: 'a' }, () => {})
  }

  if (err) {
    console.log('ledger client error(1): ' + err.toString() + (err.stack ? ('\n' + err.stack) : ''))
    return setTimeout(() => {
      if (client.sync(callback) === true) run(random.randomInt({ min: 0, max: 10 * msecs.minute }))
    }, 1 * msecs.hour)
  }

  if (!result) return run(delayTime)

  if (result.properties.wallet) {
    getStateInfo(result)
    getPaymentInfo()
  }
  cacheRuleSet(result.ruleset)

  syncWriter(statePath, result, () => { run(delayTime) })
}

var roundtrip = (params, options, callback) => {
  var i
  var parts = typeof options.server === 'string' ? url.parse(options.server) : options.server

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

  options = { url: url.format(parts), method: params.method, payload: params.payload, responseType: 'text',
              headers: underscore.defaults(params.headers || {}, { 'content-type': 'application/json; charset=utf-8' }),
              verboseP: options.verboseP
            }
  request.request(options, (err, response, body) => {
    var payload

    if ((response) && (options.verboseP)) {
      console.log('>>> HTTP/' + response.httpVersionMajor + '.' + response.httpVersionMinor + ' ' + response.statusCode +
                 ' ' + (response.statusMessage || ''))
      underscore.keys(response.headers).forEach((header) => {
        console.log('>>> ' + header + ': ' + response.headers[header])
      })
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
      if (options.verboseP) console.log('callback: ' + err0.toString() + '\n' + err0.stack)
    }
  })

  if (!options.verboseP) return

  console.log('<<< ' + params.method + ' ' + parts.protocol + '//' + parts.hostname + params.path)
  underscore.keys(options.headers).forEach((header) => { console.log('<<< ' + header + ': ' + options.headers[header]) })
  console.log('<<<')
  if (options.payload) console.log('<<< ' + JSON.stringify(params.payload, null, 2).split('\n').join('\n<<< '))
}

var run = (delayTime) => {
  var state
  var ballots = client.ballots()
  var siteSettings = appStore.getState().get('siteSettings')
  var winners = ((synopsis) && (ballots > 0) && (synopsis.winners(ballots))) || []

  console.log('\nledger client run: delayTime=' + delayTime)

  try {
    winners.forEach((winner) => {
      var result
      var siteSetting = siteSettings.get(`https?://${winner}`)

      if ((siteSetting) && (siteSetting.get('ledgerPayments') === false)) return

      result = client.vote(winner)
      if (result) state = result
    })
    if (state) syncWriter(statePath, state, () => {})
  } catch (ex) {
    console.log('ledger client error(2): ' + ex.toString() + (ex.stack ? ('\n' + ex.stack) : ''))
  }

  if (delayTime === 0) {
    delayTime = client.timeUntilReconcile()
    if (delayTime === false) delayTime = 0
  }
  if (delayTime > 0) return setTimeout(() => { if (client.sync(callback) === true) return run(0) }, delayTime)

  if (client.isReadyToReconcile()) return client.reconcile(uuid.v4().toLowerCase(), callback)

  console.log('\nwhat? wait, how can this happen?')
}

/*
 * ledger client utilities
 */

var getStateInfo = (state) => {
  var ballots, i, transaction
  var info = state.paymentInfo
  var then = underscore.now() - msecs.year

  ledgerInfo.creating = ledgerInfo.created = false
  if (state.properties.wallet) ledgerInfo.created = true
  else if (state.persona) ledgerInfo.creating = true

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
    underscore.keys(state.ballots).forEach((ballot) => {
      if (ballot.viewingId !== transaction.viewingId) return

      if (!ballots[ballot.publisher]) ballots[ballot.publisher] = 0
      ballots[ballot.publisher]++
    })

    ledgerInfo.transactions.push(underscore.extend(underscore.pick(transaction, [ 'viewingId', 'submissionStamp', 'satoshis' ]),
                                                   transaction.fee, { ballots: ballots }))
  }

  updateLedgerInfo()
}

var getPaymentInfo = () => {
  var amount, currency

  try {
    ledgerInfo.bravery = client.getBraveryProperties()
    if (ledgerInfo.bravery.fee) {
      amount = ledgerInfo.bravery.fee.amount
      currency = ledgerInfo.bravery.fee.currency
    }

    client.getWalletProperties(amount, currency, function (err, body) {
      var info = ledgerInfo._internal.paymentInfo || {}

      if (err) return console.log('getWalletProperties error: ' + err.toString())

      info = underscore.extend(info, underscore.pick(body, [ 'buyURL', 'buyURLExpires', 'balance', 'unconfirmed', 'satoshis' ]))
      info.address = client.getWalletAddress()
      if ((amount) && (currency)) {
        info = underscore.extend(info, { amount: amount, currency: currency })
        if ((body.rates) && (body.rates[currency])) info.btc = (amount / body.rates[currency]).toFixed(8)
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
  var bravery = client.getBraveryProperties()

  amount = parseInt(amount, 10)
  if (isNaN(amount) || (amount <= 0)) return

  underscore.extend(bravery.fee, { amount: amount })
  client.setBraveryProperties(bravery, callback)
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

/**
 * UI controller functionality
 */

/**
 * Show message that it's time to add funds if reconciliation is less than
 * a day in the future and balance is too low.
 */
const notifyAddFunds = () => {
  if (!getSetting(settings.PAYMENTS_ENABLED) ||
      !getSetting(settings.PAYMENTS_NOTIFICATIONS) || suppressNotifications) {
    return
  }
  const reconcileStamp = ledgerInfo.reconcileStamp
  const balance = Number(ledgerInfo.balance || 0)
  const unconfirmed = Number(ledgerInfo.unconfirmed || 0)

  if (ledgerInfo.btc && reconcileStamp &&
      reconcileStamp - underscore.now() < msecs.day &&
      balance + unconfirmed < Number(ledgerInfo.btc)) {
    addFundsMessage = addFundsMessage || locale.translation('addFundsNotification')
    appActions.showMessageBox({
      message: addFundsMessage,
      buttons: [locale.translation('updateLater'),
        locale.translation('addFunds')],
      options: {
        updateStyle: true, // TODO: Show this in the style of updateBar.less
        persist: false
      }
    })
  }
}

module.exports = {
  init: init,
  quit: quit,
  enable: enable,
  boot: boot
}
