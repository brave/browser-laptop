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

/* internal terminology:

   blockedP: the user has selected 'Never include this site' (site setting 'ledgerPaymentsShown')
    stickyP: the user has toggled ON the button to the right of the address bar (site setting 'ledgerPayments')
   excluded: the publisher appears on the list of sites to exclude from automatic inclusion (if auto-include is enabled)

  eligibleP: the current scorekeeper says the publisher has received enough durable visits
   visibleP: (stickyP OR (!excluded AND eligibleP)) AND !blockedP
contributeP: (stickyP OR !excluded) AND eligibleP   AND !blockedP
 */

const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const path = require('path')
const urlParse = require('./common/urlParse')
const urlFormat = require('url').format
const util = require('util')

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
const uuid = require('node-uuid')

const appActions = require('../js/actions/appActions')
const appConfig = require('../js/constants/appConfig')
const appConstants = require('../js/constants/appConstants')
const appDispatcher = require('../js/dispatcher/appDispatcher')
const messages = require('../js/constants/messages')
const settings = require('../js/constants/settings')
const request = require('../js/lib/request')
const getSetting = require('../js/settings').getSetting
const locale = require('./locale')
const appStore = require('../js/stores/appStore')
const eventStore = require('../js/stores/eventStore')
const rulesolver = require('./extensions/brave/content/scripts/pageInformation')
const ledgerUtil = require('./common/lib/ledgerUtil')
const tabs = require('./browser/tabs')
const {fileUrl} = require('../js/lib/appUrlUtil')

// "only-when-needed" loading...
let ledgerBalance = null
let ledgerClient = null
let ledgerGeoIP = null
let ledgerPublisher = null

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
const clientOptions = {
  debugP: process.env.LEDGER_DEBUG,
  loggingP: process.env.LEDGER_LOGGING,
  rulesTestP: process.env.LEDGER_RULES_TESTING,
  verboseP: process.env.LEDGER_VERBOSE,
  server: process.env.LEDGER_SERVER_URL,
  createWorker: app.createWorker
}

var doneTimer

var v2RulesetDB
const v2RulesetPath = 'ledger-rulesV2.leveldb'

var v2PublishersDB
const v2PublishersPath = 'ledger-publishersV2.leveldb'

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
let notificationPaymentDoneMessage
let notificationTryPaymentsMessage
let notificationTimeout = null

// TODO(bridiver) - create a better way to get setting changes
const doAction = (action) => {
  var i, publisher

/* TBD: handle

    { actionType: "window-set-blocked-by"
    , frameProps:
      { audioPlaybackActive: true
        ...
      }
    , ...
    }
 */
  if (publisherInfo._internal.debugP) {
    console.log('\napplication event: ' + JSON.stringify(underscore.pick(action, [ 'actionType', 'key' ]), null, 2))
  }

  switch (action.actionType) {
    case appConstants.APP_SHUTTING_DOWN:
      quit()
      break

    case appConstants.APP_IDLE_STATE_CHANGED:
      visit('NOOP', underscore.now(), null)
      break

    case appConstants.APP_CHANGE_SETTING:
      switch (action.key) {
        case settings.PAYMENTS_ENABLED:
          initialize(action.value)
          break

        case settings.PAYMENTS_CONTRIBUTION_AMOUNT:
          setPaymentInfo(action.value)
          break

        case settings.MINIMUM_VISIT_TIME:
          if (action.value <= 0) break

          synopsis.options.minPublisherDuration = action.value
          updatePublisherInfo()
          break

        case settings.MINIMUM_VISITS:
          if (action.value <= 0) break

          synopsis.options.minPublisherVisits = action.value
          updatePublisherInfo()
          break

        default:
          break
      }
      break

    case appConstants.APP_CHANGE_SITE_SETTING:
      i = action.hostPattern.indexOf('://')
      if (i === -1) break

      publisher = action.hostPattern.substr(i + 3)
      if (action.key === 'ledgerPaymentsShown') {
        if (action.value === false) {
          if (publisherInfo._internal.verboseP) console.log('\npurging ' + publisher)
          delete synopsis.publishers[publisher]
          delete publishers[publisher]
          updatePublisherInfo()
        }
      } else if (action.key === 'ledgerPayments') {
        if (!synopsis.publishers[publisher]) break

        if (publisherInfo._internal.verboseP) console.log('\nupdating ' + publisher + ' stickyP=' + action.value)
        updatePublisherInfo()
        verifiedP(publisher)
      } else if (action.key === 'ledgerPinPercentage') {
        if (!synopsis.publishers[publisher]) break
        synopsis.publishers[publisher].pinPercentage = action.value
        updatePublisherInfo(publisher)
      }
      break

    case appConstants.APP_REMOVE_SITE_SETTING:
      i = action.hostPattern.indexOf('://')
      if (i === -1) break

      publisher = action.hostPattern.substr(i + 3)
      if (action.key === 'ledgerPayments') {
        if (!synopsis.publishers[publisher]) break

        if (publisherInfo._internal.verboseP) console.log('\nupdating ' + publisher + ' stickyP=' + true)
        updatePublisherInfo()
      }
      break

    case appConstants.APP_NETWORK_CONNECTED:
      setTimeout(networkConnected, 1 * msecs.second)
      break

    case appConstants.APP_NAVIGATOR_HANDLER_REGISTERED:
      ledgerInfo.hasBitcoinHandler = (action.protocol === 'bitcoin')
      appActions.updateLedgerInfo(underscore.omit(ledgerInfo, [ '_internal' ]))
      break

    case appConstants.APP_NAVIGATOR_HANDLER_UNREGISTERED:
      ledgerInfo.hasBitcoinHandler = false
      appActions.updateLedgerInfo(underscore.omit(ledgerInfo, [ '_internal' ]))
      break

    default:
      break
  }
}

/*
 * module entry points
 */
var init = () => {
  try {
    appDispatcher.register(doAction)
    initialize(getSetting(settings.PAYMENTS_ENABLED))

    doneTimer = setInterval(doneWriter, 1 * msecs.hour)
  } catch (ex) { console.log('ledger.js initialization failed: ' + ex.toString() + '\n' + ex.stack) }
}

var quit = () => {
  visit('NOOP', underscore.now(), null)
  clearInterval(doneTimer)
  doneWriter()
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
      clientprep()
      client = ledgerClient(null, underscore.extend({ roundtrip: roundtrip }, clientOptions), null)
    } catch (ex) {
      appActions.updateLedgerInfo({})

      bootP = false
      return console.log('ledger client boot error: ' + ex.toString() + '\n' + ex.stack)
    }
    if (client.sync(callback) === true) run(random.randomInt({ min: msecs.minute, max: 10 * msecs.minute }))
    getBalance()

    bootP = false
  })
}

/*
 * Print or Save Recovery Keys
 */

var backupKeys = (appState, action) => {
  const date = moment().format('L')
  const paymentId = appState.getIn(['ledgerInfo', 'paymentId'])
  const passphrase = appState.getIn(['ledgerInfo', 'passphrase'])

  const messageLines = [
    locale.translation('ledgerBackupText1'),
    [locale.translation('ledgerBackupText2'), date].join(' '),
    '',
    [locale.translation('ledgerBackupText3'), paymentId].join(' '),
    [locale.translation('ledgerBackupText4'), passphrase].join(' '),
    '',
    locale.translation('ledgerBackupText5')
  ]

  const message = messageLines.join(os.EOL)
  const filePath = path.join(app.getPath('userData'), '/brave_wallet_recovery.txt')

  fs.writeFile(filePath, message, (err) => {
    if (err) {
      console.log(err)
    } else {
      tabs.create({url: fileUrl(filePath)}, (webContents) => {
        if (action.backupAction === 'print') {
          webContents.print({silent: false, printBackground: false})
        } else {
          webContents.downloadURL(fileUrl(filePath), true)
        }
      })
    }
  })

  return appState
}

var loadKeysFromBackupFile = (filePath) => {
  let keys = null
  let data = fs.readFileSync(filePath)

  if (!data || !data.length || !(data.toString())) {
    logError('No data in backup file', 'recoveryWallet')
  } else {
    try {
      const recoveryFileContents = data.toString()

      let messageLines = recoveryFileContents.split(os.EOL)

      let paymentIdLine = '' || messageLines[3]
      let passphraseLine = '' || messageLines[4]

      const paymentIdPattern = new RegExp([locale.translation('ledgerBackupText3'), '([^ ]+)'].join(' '))
      const paymentId = (paymentIdLine.match(paymentIdPattern) || [])[1]

      const passphrasePattern = new RegExp([locale.translation('ledgerBackupText4'), '(.+)$'].join(' '))
      const passphrase = (passphraseLine.match(passphrasePattern) || [])[1]

      keys = {
        paymentId,
        passphrase
      }
    } catch (exc) {
      logError(exc, 'recoveryWallet')
    }
  }

  return keys
}

/*
 * Recover Ledger Keys
 */

var recoverKeys = (appState, action) => {
  let firstRecoveryKey, secondRecoveryKey

  if (action.useRecoveryKeyFile) {
    let recoveryKeyFile = promptForRecoveryKeyFile()
    if (!recoveryKeyFile) {
      // user canceled from dialog, we abort without error
      return appState
    }

    if (recoveryKeyFile) {
      let keys = loadKeysFromBackupFile(recoveryKeyFile) || {}

      if (keys) {
        firstRecoveryKey = keys.paymentId
        secondRecoveryKey = keys.passphrase
      }
    }
  }

  if (!firstRecoveryKey || !secondRecoveryKey) {
    firstRecoveryKey = action.firstRecoveryKey
    secondRecoveryKey = action.secondRecoveryKey
  }

  const UUID_REGEX = /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/
  if (typeof firstRecoveryKey !== 'string' || !firstRecoveryKey.match(UUID_REGEX) || typeof secondRecoveryKey !== 'string' || !secondRecoveryKey.match(UUID_REGEX)) {
    // calling logError sets the error object
    logError(true, 'recoverKeys')
    appActions.updateLedgerInfo(underscore.omit(ledgerInfo, [ '_internal' ]))
    appActions.ledgerRecoveryFailed()
    return appState
  }

  client.recoverWallet(firstRecoveryKey, secondRecoveryKey, (err, result) => {
    let existingLedgerError = ledgerInfo.error

    if (logError(err, 'recoveryWallet')) {
      // we reset ledgerInfo.error to what it was before (likely null)
      // if ledgerInfo.error is not null, the wallet info will not display in UI
      // logError sets ledgerInfo.error, so we must we clear it or UI will show an error
      ledgerInfo.error = existingLedgerError
      appActions.updateLedgerInfo(underscore.omit(ledgerInfo, [ '_internal' ]))
      appActions.ledgerRecoveryFailed()
    } else {
      callback(err, result)

      appActions.updateLedgerInfo(underscore.omit(ledgerInfo, [ '_internal' ]))
      if (balanceTimeoutId) clearTimeout(balanceTimeoutId)
      getBalance()
      appActions.ledgerRecoverySucceeded()
    }
  })

  return appState
}

const dialog = electron.dialog

var promptForRecoveryKeyFile = () => {
  const defaultRecoveryKeyFilePath = path.join(app.getPath('userData'), '/brave_wallet_recovery.txt')

  let files

  if (process.env.SPECTRON) {
    // skip the dialog for tests
    console.log(`for test, trying to recover keys from path: ${defaultRecoveryKeyFilePath}`)
    files = [defaultRecoveryKeyFilePath]
  } else {
    files = dialog.showOpenDialog({
      properties: ['openFile'],
      defaultPath: defaultRecoveryKeyFilePath,
      filters: [{
        name: 'TXT files',
        extensions: ['txt']
      }]
    })
  }

  return (files && files.length ? files[0] : null)
}

/*
 * IPC entry point
 */

if (ipc) {
  ipc.on(messages.LEDGER_CREATE_WALLET, () => {
    boot()
  })

  ipc.on(messages.LEDGER_PAYMENTS_PRESENT, (event, presentP) => {
    if (presentP) {
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

    event.returnValue = { context: ctx, rules: publisherInfo._internal.ruleset.cooked }
  })

  ipc.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex) => {
    const win = electron.BrowserWindow.getActiveWindow()
    if (message === addFundsMessage) {
      appActions.hideNotification(message)
      // See showNotificationAddFunds() for buttons.
      // buttonIndex === 1 is "Later"; the timestamp until which to delay is set
      // in showNotificationAddFunds() when triggering this notification.
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      } else if (buttonIndex === 2 && win) {
        // Add funds: Open payments panel
        appActions.maybeCreateTabRequested({
          url: 'about:preferences#payments',
          windowId: win.id
        })
      }
    } else if (message === reconciliationMessage) {
      appActions.hideNotification(message)
      // buttonIndex === 1 is Dismiss
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      } else if (buttonIndex === 2 && win) {
        appActions.maybeCreateTabRequested({
          url: 'about:preferences#payments',
          windowId: win.id
        })
      }
    } else if (message === notificationPaymentDoneMessage) {
      appActions.hideNotification(message)
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      }
    } else if (message === notificationTryPaymentsMessage) {
      appActions.hideNotification(message)
      if (buttonIndex === 1 && win) {
        appActions.maybeCreateTabRequested({
          url: 'about:preferences#payments',
          windowId: win.id
        })
      }
      appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED, true)
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
  var initP
  const eventState = eventStore.getState().toJS()
  var view = eventState.page_view
  var info = eventState.page_info
  var pageLoad = eventState.page_load

  if ((!synopsis) || (!util.isArray(info))) return

// NB: in theory we have already seen every element in info except for (perhaps) the last one...
  underscore.rest(info, info.length - 1).forEach((page) => {
    let pattern, publisher
    let location = page.url

    if (location.match(/^about/)) return

    location = urlFormat(underscore.pick(urlParse(location), [ 'protocol', 'host', 'hostname', 'port', 'pathname' ]))
    publisher = locations[location] && locations[location].publisher
    if (publisher) {
      if (synopsis.publishers[publisher] &&
        (typeof synopsis.publishers[publisher].faviconURL === 'undefined' || synopsis.publishers[publisher].faviconURL === null)) {
        getFavIcon(synopsis.publishers[publisher], page, location)
      }
      return updateLocation(location, publisher)
    }

    if (!page.publisher) {
      try {
        publisher = ledgerPublisher.getPublisher(location, publisherInfo._internal.ruleset.raw)
        if ((publisher) && (blockedP(publisher))) publisher = null
        if (publisher) page.publisher = publisher
      } catch (ex) {
        console.log('getPublisher error for ' + location + ': ' + ex.toString())
      }
    }
    locations[location] = underscore.omit(page, [ 'url', 'protocol', 'faviconURL' ])
    if (!page.publisher) return

    publisher = page.publisher
    pattern = `https?://${publisher}`
    initP = !synopsis.publishers[publisher]
    synopsis.initPublisher(publisher)
    if (initP) {
      excludeP(publisher, (unused, exclude) => {
        if (!getSetting(settings.AUTO_SUGGEST_SITES)) {
          exclude = false
        } else {
          exclude = !exclude
        }
        appActions.changeSiteSetting(pattern, 'ledgerPayments', exclude)
        updatePublisherInfo()
      })
    }
    updateLocation(location, publisher)
    getFavIcon(synopsis.publishers[publisher], page, location)
  })

  view = underscore.last(view) || {}
  if (ledgerUtil.shouldTrackView(view, pageLoad)) {
    visit(view.url || 'NOOP', view.timestamp || underscore.now(), view.tabId)
  }
})

/*
 * module initialization
 */

var initialize = (paymentsEnabled) => {
  var ruleset

  if (!v2RulesetDB) v2RulesetDB = levelup(pathName(v2RulesetPath))
  if (!v2PublishersDB) v2PublishersDB = levelup(pathName(v2PublishersPath))
  enable(paymentsEnabled)

  // Check if relevant browser notifications should be shown every 15 minutes
  if (notificationTimeout) clearInterval(notificationTimeout)
  notificationTimeout = setInterval(showNotifications, 15 * msecs.minute)

  if (!paymentsEnabled) {
    client = null
    return appActions.updateLedgerInfo({})
  }
  if (client) return

  if (!ledgerPublisher) ledgerPublisher = require('ledger-publisher')
  ruleset = []
  ledgerPublisher.ruleset.forEach(rule => { if (rule.consequent) ruleset.push(rule) })
  cacheRuleSet(ruleset)

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
          clientprep()
          client = ledgerClient(state.personaId,
                                underscore.extend(state.options, { roundtrip: roundtrip }, clientOptions),
                                state)

          // Scenario: User enables Payments, disables it, waits 30+ days, then
          // enables it again -> reconcileStamp is in the past.
          // In this case reset reconcileStamp to the future.
          let timeUntilReconcile = client.timeUntilReconcile()
          let ledgerWindow = (synopsis.options.numFrames - 1) * synopsis.options.frameSize
          if (typeof timeUntilReconcile === 'number' && timeUntilReconcile < -ledgerWindow) {
            client.setTimeUntilReconcile(null, (err, stateResult) => {
              if (err) return console.log('ledger setTimeUntilReconcile error: ' + err.toString())

              if (!stateResult) {
                return
              }
              getStateInfo(stateResult)

              atomicWriter(pathName(statePath), stateResult, { flushP: true }, () => {})
            })
          }
        } catch (ex) {
          return console.log('ledger client creation error: ' + ex.toString() + '\n' + ex.stack)
        }

        // speed-up browser start-up by delaying the first synchronization action
        setTimeout(() => {
          if (!client) return

          if (client.sync(callback) === true) run(random.randomInt({ min: msecs.minute, max: 10 * msecs.minute }))
          cacheRuleSet(state.ruleset)
        }, 3 * msecs.second)

        // Make sure bravery props are up-to-date with user settings
        if (!ledgerInfo.address) ledgerInfo.address = client.getWalletAddress()
        setPaymentInfo(getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT))
        getBalance()
      })
      return
    }

    if (err.code !== 'ENOENT') console.log('statePath read error: ' + err.toString())
    appActions.updateLedgerInfo({})
  })
}

var clientprep = () => {
  if (!ledgerClient) ledgerClient = require('ledger-client')
  ledgerInfo._internal.debugP = ledgerClient.prototype.boolion(process.env.LEDGER_CLIENT_DEBUG)
  publisherInfo._internal.debugP = ledgerClient.prototype.boolion(process.env.LEDGER_PUBLISHER_DEBUG)
  publisherInfo._internal.verboseP = ledgerClient.prototype.boolion(process.env.LEDGER_PUBLISHER_VERBOSE)
}

var enable = (paymentsEnabled) => {
  if (paymentsEnabled && !getSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED)) {
    appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED, true)
  }

  publisherInfo._internal.enabled = paymentsEnabled
  if (synopsis) return updatePublisherInfo()

  if (!ledgerPublisher) ledgerPublisher = require('ledger-publisher')
  synopsis = new (ledgerPublisher.Synopsis)()
  fs.readFile(pathName(synopsisPath), (err, data) => {
    var initSynopsis = () => {
      var value

      // cf., the `Synopsis` constructor, https://github.com/brave/ledger-publisher/blob/master/index.js#L167
      value = getSetting(settings.MINIMUM_VISIT_TIME)
      if (!value) {
        value = 8 * 1000
        appActions.changeSetting(settings.MINIMUM_VISIT_TIME, value)
      }

      // for earlier versions of the code...
      if ((value > 0) && (value < 1000)) synopsis.options.minPublisherDuration = value * 1000

      value = getSetting(settings.MINIMUM_VISITS)
      if (!value) {
        value = 1
        appActions.changeSetting(settings.MINIMUM_VISITS, value)
      }
      if (value > 0) synopsis.options.minPublisherVisits = value

      if (process.env.NODE_ENV === 'test') {
        synopsis.options.minPublisherDuration = 0
        synopsis.options.minPublisherVisits = 0
      } else {
        if (process.env.LEDGER_PUBLISHER_MIN_DURATION) {
          synopsis.options.minPublisherDuration = ledgerClient.prototype.numbion(process.env.LEDGER_PUBLISHER_MIN_DURATION)
        }
        if (process.env.LEDGER_PUBLISHER_MIN_VISITS) {
          synopsis.options.minPublisherVisits = ledgerClient.prototype.numbion(process.env.LEDGER_PUBLISHER_MIN_VISITS)
        }
      }

      underscore.keys(synopsis.publishers).forEach((publisher) => {
        excludeP(publisher)
        verifiedP(publisher)
      })

      updatePublisherInfo()
    }

    if (publisherInfo._internal.verboseP) console.log('\nstarting up ledger publisher integration')

    if (err) {
      if (err.code !== 'ENOENT') console.log('synopsisPath read error: ' + err.toString())
      initSynopsis()
      return updatePublisherInfo()
    }

    if (publisherInfo._internal.verboseP) console.log('\nfound ' + pathName(synopsisPath))
    try {
      synopsis = new (ledgerPublisher.Synopsis)(data)
    } catch (ex) {
      console.log('synopsisPath parse error: ' + ex.toString())
    }
    initSynopsis()
    underscore.keys(synopsis.publishers).forEach((publisher) => {
      if (synopsis.publishers[publisher].faviconURL === null) delete synopsis.publishers[publisher].faviconURL
    })
    updatePublisherInfo()

    // change undefined include publishers to include publishers
    appActions.enableUndefinedPublishers(synopsis.publishers)

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
            updateLocation(entry.location, publisher)
          })
        })
      } catch (ex) {
        console.log('publishersPath parse error: ' + ex.toString())
      }
    })
  })
}

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

/*
 * update publisher information
 */

var publisherInfo = {
  options: undefined,

  synopsis: undefined,

  _internal: {
    enabled: false,

    ruleset: { raw: [], cooked: [] }
  }
}

const getFavIcon = (entry, page, location) => {
  if ((page.protocol) && (!entry.protocol)) {
    entry.protocol = page.protocol
  }

  if ((typeof entry.faviconURL === 'undefined') && ((page.faviconURL) || (entry.protocol))) {
    let faviconURL = page.faviconURL || entry.protocol + '//' + urlParse(location).host + '/favicon.ico'
    if (publisherInfo._internal.debugP) {
      console.log('\nrequest: ' + faviconURL)
    }

    entry.faviconURL = null
    fetchFavIcon(entry, faviconURL)
  }
}

const fetchFavIcon = (entry, url, redirects) => {
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
      console.log('response error: ' + err.toString() + '\n' + err.stack)
      return null
    }

    if ((response.statusCode === 301) && (response.headers.location)) {
      if (redirects < 3) fetchFavIcon(entry, response.headers.location, redirects++)
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
      console.log('\n' + entry.site + ' synopsis=' +
        JSON.stringify(underscore.extend(underscore.omit(entry, [ 'faviconURL', 'window' ]),
          { faviconURL: entry.faviconURL && '... ' }), null, 2))
    }

    entry.faviconURL = blob
    updatePublisherInfo()
  })
}

var updatePublisherInfo = (changedPublisher) => {
  var data = {}
  var then = underscore.now() - msecs.week

  underscore.keys(publishers).sort().forEach((publisher) => {
    var entries = []

    underscore.keys(publishers[publisher]).forEach((location) => {
      var when = publishers[publisher][location].timestamp

      if (when > then) entries.push({ location: location, when: when })
    })

    if (entries.length > 0) data[publisher] = entries
  })
  atomicWriter(pathName(publisherPath), data, () => {})
  atomicWriter(pathName(scoresPath), synopsis.allN(), () => {})

  atomicWriter(pathName(synopsisPath), synopsis, () => {})
  if (!publisherInfo._internal.enabled) return

  publisherInfo.synopsis = synopsisNormalizer(changedPublisher)
  publisherInfo.synopsisOptions = synopsis.options

  if (publisherInfo._internal.debugP) {
    data = []
    publisherInfo.synopsis.forEach((entry) => {
      data.push(underscore.extend(underscore.omit(entry, [ 'faviconURL' ]), { faviconURL: entry.faviconURL && '...' }))
    })

    console.log('\nupdatePublisherInfo: ' + JSON.stringify({ options: publisherInfo.synopsisOptions, synopsis: data }, null, 2))
  }

  appActions.updatePublisherInfo(underscore.omit(publisherInfo, [ '_internal' ]))
}

var blockedP = (publisher) => {
  var siteSetting = appStore.getState().get('siteSettings').get(`https?://${publisher}`)

  return ((!!siteSetting) && (siteSetting.get('ledgerPaymentsShown') === false))
}

var stickyP = (publisher) => {
  var siteSettings = appStore.getState().get('siteSettings')
  var pattern = `https?://${publisher}`
  var siteSetting = siteSettings.get(pattern)
  var result = (siteSetting) && (siteSetting.get('ledgerPayments'))

  // NB: legacy clean-up
  if ((typeof result === 'undefined') && (typeof synopsis.publishers[publisher].options.stickyP !== 'undefined')) {
    result = synopsis.publishers[publisher].options.stickyP
    appActions.changeSiteSetting(pattern, 'ledgerPayments', result)
  }

  if (synopsis.publishers[publisher] &&
    synopsis.publishers[publisher].options &&
    synopsis.publishers[publisher].options.stickyP) {
    delete synopsis.publishers[publisher].options.stickyP
  }

  return (result === undefined || result)
}

var eligibleP = (publisher) => {
  if (!synopsis.options.minPublisherDuration && process.env.NODE_ENV !== 'test') {
    synopsis.options.minPublisherDuration = getSetting(settings.MINIMUM_VISIT_TIME)
  }

  return ((synopsis.publishers[publisher].scores[synopsis.options.scorekeeper] > 0) &&
          (synopsis.publishers[publisher].duration >= synopsis.options.minPublisherDuration) &&
          (synopsis.publishers[publisher].visits >= synopsis.options.minPublisherVisits))
}

var visibleP = (publisher) => {
  return (
      eligibleP(publisher) &&
      (
        synopsis.publishers[publisher].options.exclude !== true ||
        stickyP(publisher)
      )
    ) &&
    !blockedP(publisher)
}

var contributeP = (publisher) => {
  return (((stickyP(publisher)) || (synopsis.publishers[publisher].options.exclude !== true)) &&
          (eligibleP(publisher)) &&
          (!blockedP(publisher)))
}

var synopsisNormalizer = (changedPublisher) => {
  // courtesy of https://stackoverflow.com/questions/13483430/how-to-make-rounded-percentages-add-up-to-100#13485888
  const roundToTarget = (l, target, property) => {
    let off = target - underscore.reduce(l, (acc, x) => { return acc + Math.round(x[property]) }, 0)

    return underscore.sortBy(l, (x) => Math.round(x[property]) - x[property])
      .map((x, i) => {
        x[property] = Math.round(x[property]) + (off > i) - (i >= (l.length + off))
        return x
      })
  }

  const normalizePinned = (dataPinned, total, target, setOne) => dataPinned.map((publisher) => {
    let newPer
    let floatNumber

    if (setOne) {
      newPer = 1
      floatNumber = 1
    } else {
      floatNumber = (publisher.pinPercentage / total) * target
      newPer = Math.floor(floatNumber)
      if (newPer < 1) {
        newPer = 1
      }
    }

    publisher.weight = floatNumber
    publisher.pinPercentage = newPer
    return publisher
  })

  const getPublisherData = (result) => {
    let duration = result.duration

    let data = {
      verified: result.options.verified || false,
      site: result.publisher,
      views: result.visits,
      duration: duration,
      daysSpent: 0,
      hoursSpent: 0,
      minutesSpent: 0,
      secondsSpent: 0,
      faviconURL: result.faviconURL,
      score: result.scores[scorekeeper],
      pinPercentage: result.pinPercentage,
      weight: result.pinPercentage
    }
    // HACK: Protocol is sometimes blank here, so default to http:// so we can
    // still generate publisherURL.
    data.publisherURL = (result.protocol || 'http:') + '//' + result.publisher

    if (duration >= msecs.day) {
      data.daysSpent = Math.max(Math.round(duration / msecs.day), 1)
    } else if (duration >= msecs.hour) {
      data.hoursSpent = Math.max(Math.floor(duration / msecs.hour), 1)
      data.minutesSpent = Math.round((duration % msecs.hour) / msecs.minute)
    } else if (duration >= msecs.minute) {
      data.minutesSpent = Math.max(Math.round(duration / msecs.minute), 1)
      data.secondsSpent = Math.round((duration % msecs.minute) / msecs.second)
    } else {
      data.secondsSpent = Math.max(Math.round(duration / msecs.second), 1)
    }

    return data
  }

  let results
  let dataPinned = []
  let dataUnPinned = []
  let dataExcluded = []
  let pinnedTotal = 0
  let unPinnedTotal = 0
  const scorekeeper = synopsis.options.scorekeeper

  results = []
  underscore.keys(synopsis.publishers).forEach((publisher) => {
    if (!visibleP(publisher)) return

    results.push(underscore.extend({publisher: publisher}, underscore.omit(synopsis.publishers[publisher], 'window')))
  }, synopsis)
  results = underscore.sortBy(results, (entry) => { return -entry.scores[scorekeeper] })

  // move publisher to the correct array and get totals
  results.forEach((result) => {
    if (result.pinPercentage && result.pinPercentage > 0) {
      // pinned
      pinnedTotal += result.pinPercentage
      dataPinned.push(getPublisherData(result))
    } else if (stickyP(result.publisher)) {
      // unpinned
      unPinnedTotal += result.scores[scorekeeper]
      dataUnPinned.push(result)
    } else {
      // excluded
      let publisher = getPublisherData(result)
      publisher.percentage = 0
      publisher.weight = 0
      dataExcluded.push(publisher)
    }
  })

  // round if over 100% of pinned publishers
  if (pinnedTotal > 100) {
    const changedObject = dataPinned.filter(publisher => publisher.site === changedPublisher)[0]
    const setOne = changedObject.pinPercentage > (100 - dataPinned.length - 1)

    if (setOne) {
      changedObject.pinPercentage = 100 - dataPinned.length + 1
      changedObject.weight = changedObject.pinPercentage
    }

    const pinnedRestTotal = pinnedTotal - changedObject.pinPercentage
    dataPinned = dataPinned.filter(publisher => publisher.site !== changedPublisher)
    dataPinned = normalizePinned(dataPinned, pinnedRestTotal, (100 - changedObject.pinPercentage), setOne)
    dataPinned = roundToTarget(dataPinned, (100 - changedObject.pinPercentage), 'pinPercentage')

    dataUnPinned = dataUnPinned.map((result) => {
      let publisher = getPublisherData(result)
      publisher.percentage = 0
      publisher.weight = 0
      return publisher
    })

    dataPinned.push(changedObject)

    // sync app store
    appActions.changeLedgerPinnedPercentages(dataPinned)
  } else if (dataUnPinned.length === 0 && pinnedTotal < 100) {
    // when you don't have any unpinned sites and pinned total is less then 100 %
    dataPinned = normalizePinned(dataPinned, pinnedTotal, 100, false)
    dataPinned = roundToTarget(dataPinned, 100, 'pinPercentage')

    // sync app store
    appActions.changeLedgerPinnedPercentages(dataPinned)
  } else {
    // unpinned publishers
    dataUnPinned = dataUnPinned.map((result) => {
      let publisher = getPublisherData(result)
      const floatNumber = (publisher.score / unPinnedTotal) * (100 - pinnedTotal)
      publisher.percentage = Math.round(floatNumber)
      publisher.weight = floatNumber
      return publisher
    })

    // normalize unpinned values
    dataUnPinned = roundToTarget(dataUnPinned, (100 - pinnedTotal), 'percentage')
  }

  const newData = dataPinned.concat(dataUnPinned, dataExcluded)

  // sync synopsis
  newData.forEach((item) => {
    synopsis.publishers[item.site].weight = item.weight
    synopsis.publishers[item.site].pinPercentage = item.pinPercentage
  })

  return newData
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
    verifiedP(publisher)
  }

  setLocation()
  if (location === currentLocation) return

  currentLocation = location.match(/^about/) ? 'NOOP' : location
  currentTimestamp = timestamp
}

var cacheRuleSet = (ruleset) => {
  var stewed, syncP

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
      var ctx = urlParse(location, true)

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
        delete publishers[publisher]
        syncP = true
      })
    })
    if (!syncP) return

    updatePublisherInfo()
  } catch (ex) {
    console.log('ruleset error: ' + ex.toString() + '\n' + ex.stack)
  }
}

var excludeP = (publisher, callback) => {
  var doneP

  var done = (err, result) => {
    doneP = true
    if ((!err) && (typeof result !== 'undefined') && (!!synopsis.publishers[publisher]) &&
        (synopsis.publishers[publisher].options.exclude !== result)) {
      synopsis.publishers[publisher].options.exclude = result
      updatePublisherInfo()
    }

    if (callback) callback(err, result)
  }

  if (!v2RulesetDB) return setTimeout(() => { excludeP(publisher, callback) }, 5 * msecs.second)

  inspectP(v2RulesetDB, v2RulesetPath, publisher, 'exclude', 'domain:' + publisher, (err, result) => {
    var props

    if (!err) return done(err, result.exclude)

    props = ledgerPublisher.getPublisherProps('https://' + publisher)
    if (!props) return done()

    v2RulesetDB.createReadStream({ lt: 'domain:' }).on('data', (data) => {
      var regexp, result, sldP, tldP

      if (doneP) return

      sldP = data.key.indexOf('SLD:') === 0
      tldP = data.key.indexOf('TLD:') === 0
      if ((!tldP) && (!sldP)) return

      if (underscore.intersection(data.key.split(''),
                                   [ '^', '$', '*', '+', '?', '[', '(', '{', '|' ]).length === 0) {
        if ((data.key !== ('TLD:' + props.TLD)) && (data.key !== ('SLD:' + props.SLD.split('.')[0]))) return
      } else {
        try {
          regexp = new RegExp(data.key.substr(4))
          if (!regexp.test(props[tldP ? 'TLD' : 'SLD'])) return
        } catch (ex) {
          console.log(v2RulesetPath + ' stream invalid regexp ' + data.key + ': ' + ex.toString())
        }
      }

      try {
        result = JSON.parse(data.value)
      } catch (ex) {
        console.log(v2RulesetPath + ' stream invalid JSON ' + data.entry + ': ' + data.value)
      }

      done(null, result.exclude)
    }).on('error', (err) => {
      console.log(v2RulesetPath + ' stream error: ' + JSON.stringify(err, null, 2))
    }).on('close', () => {
    }).on('end', () => {
      if (!doneP) done(null, false)
    })
  })
}

var verifiedP = (publisher, callback) => {
  inspectP(v2PublishersDB, v2PublishersPath, publisher, 'verified', null, callback)
}

var inspectP = (db, path, publisher, property, key, callback) => {
  var done = (err, result) => {
    if ((!err) && (typeof result !== 'undefined') && (!!synopsis.publishers[publisher]) &&
        (synopsis.publishers[publisher].options[property] !== result[property])) {
      synopsis.publishers[publisher].options[property] = result[property]
      updatePublisherInfo()
    }

    if (callback) callback(err, result)
  }

  if (!key) key = publisher
  db.get(key, (err, value) => {
    var result

    if (err) {
      if (!err.notFound) console.log(path + ' get ' + key + ' error: ' + JSON.stringify(err, null, 2))
      return done(err)
    }

    try {
      result = JSON.parse(value)
    } catch (ex) {
      console.log(v2RulesetPath + ' stream invalid JSON ' + key + ': ' + value)
      result = {}
    }

    done(null, result)
  })
}

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
                      underscore.pick(info, [ 'address', 'passphrase', 'balance', 'unconfirmed', 'satoshis', 'btc', 'amount',
                        'currency' ]))
    if ((!info.buyURLExpires) || (info.buyURLExpires > now)) {
      ledgerInfo.buyURL = info.buyURL
      ledgerInfo.buyMaximumUSD = 6
    }
    if (typeof process.env.ADDFUNDS_URL !== 'undefined') {
      ledgerInfo.buyURLFrame = true
      ledgerInfo.buyURL = process.env.ADDFUNDS_URL + '?' +
                          querystring.stringify({ currency: ledgerInfo.currency,
                            amount: getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT),
                            address: ledgerInfo.address })
      ledgerInfo.buyMaximumUSD = false
    }

    underscore.extend(ledgerInfo, ledgerInfo._internal.cache || {})
  }

  if ((client) && (now > ledgerInfo._internal.geoipExpiry)) {
    ledgerInfo._internal.geoipExpiry = now + (5 * msecs.minute)

    if (!ledgerGeoIP) ledgerGeoIP = require('ledger-geoip')
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
  var i, results, then
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

    atomicWriter(pathName(logPath), entries, { flag: 'a' }, () => {})
  }

  if (err) {
    console.log('ledger client error(1): ' + JSON.stringify(err, null, 2) + (err.stack ? ('\n' + err.stack) : ''))
    if (!client) return

    if (typeof delayTime === 'undefined') delayTime = random.randomInt({ min: msecs.minute, max: 10 * msecs.minute })
  }

  if (!result) return run(delayTime)

  if ((client) && (result.properties.wallet)) {
    if (!ledgerInfo.created) setPaymentInfo(getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT))

    getStateInfo(result)
    getPaymentInfo()
  }
  cacheRuleSet(result.ruleset)
  if (result.rulesetV2) {
    results = result.rulesetV2
    delete result.rulesetV2

    entries = []
    results.forEach((entry) => {
      var key = entry.facet + ':' + entry.publisher

      if (entry.exclude !== false) {
        entries.push({ type: 'put', key: key, value: JSON.stringify(underscore.omit(entry, [ 'facet', 'publisher' ])) })
      } else {
        entries.push({ type: 'del', key: key })
      }
    })

    v2RulesetDB.batch(entries, (err) => {
      if (err) return console.log(v2RulesetPath + ' error: ' + JSON.stringify(err, null, 2))

      if (entries.length === 0) return

      underscore.keys(synopsis.publishers).forEach((publisher) => {
// be safe...
        if (synopsis.publishers[publisher]) delete synopsis.publishers[publisher].options.exclude

        excludeP(publisher)
      })
    })
  }
  if (result.publishersV2) {
    results = result.publishersV2
    delete result.publishersV2

    entries = []
    results.forEach((entry) => {
      entries.push({ type: 'put',
        key: entry.publisher,
        value: JSON.stringify(underscore.omit(entry, [ 'publisher' ]))
      })
      if ((synopsis.publishers[entry.publisher]) &&
          (synopsis.publishers[entry.publisher].options.verified !== entry.verified)) {
        synopsis.publishers[entry.publisher].options.verified = entry.verified
        updatePublisherInfo()
      }
    })
    v2PublishersDB.batch(entries, (err) => {
      if (err) return console.log(v2PublishersPath + ' error: ' + JSON.stringify(err, null, 2))
    })
  }

  atomicWriter(pathName(statePath), result, { flushP: true }, () => {})
  run(delayTime)
}

var roundtrip = (params, options, callback) => {
  var i
  var parts = typeof params.server === 'string' ? urlParse(params.server)
                : typeof params.server !== 'undefined' ? params.server
                : typeof options.server === 'string' ? urlParse(options.server) : options.server
  var rawP = options.rawP

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
    url: urlFormat(parts),
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
      payload = rawP ? body : (response.statusCode !== 204) ? JSON.parse(body) : null
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
  if (clientOptions.verboseP) {
    var entries

    console.log('\nledger client run: clientP=' + (!!client) + ' delayTime=' + delayTime)

    var line = (fields) => {
      var result = ''

      fields.forEach((field) => {
        var spaces
        var max = (result.length > 0) ? 9 : 19

        if (typeof field !== 'string') field = field.toString()
        if (field.length < max) {
          spaces = ' '.repeat(max - field.length)
          field = spaces + field
        } else {
          field = field.substr(0, max)
        }
        result += ' ' + field
      })

      console.log(result.substr(1))
    }

    line([ 'publisher',
      'blockedP', 'stickyP', 'verified',
      'excluded', 'eligibleP', 'visibleP',
      'contribP',
      'duration', 'visits'
    ])
    entries = synopsis.topN() || []
    entries.forEach((entry) => {
      var publisher = entry.publisher

      line([ publisher,
        blockedP(publisher), stickyP(publisher), synopsis.publishers[publisher].options.verified === true,
        synopsis.publishers[publisher].options.exclude === true, eligibleP(publisher), visibleP(publisher),
        contributeP(publisher),
        Math.round(synopsis.publishers[publisher].duration / 1000), synopsis.publishers[publisher].visits ])
    })
  }

  if ((typeof delayTime === 'undefined') || (!client)) return

  var active, state, weights, winners
  var ballots = client.ballots()
  var data = (synopsis) && (ballots > 0) && synopsisNormalizer()

  if (data) {
    weights = []
    data.forEach((datum) => { weights.push({ publisher: datum.site, weight: datum.weight / 100.0 }) })
    winners = synopsis.winners(ballots, weights)
  }
  if (!winners) winners = []

  try {
    winners.forEach((winner) => {
      var result

      if (!contributeP(winner)) return

      result = client.vote(winner)
      if (result) state = result
    })
    if (state) atomicWriter(pathName(statePath), state, { flushP: true }, () => {})
  } catch (ex) {
    console.log('ledger client error(2): ' + ex.toString() + (ex.stack ? ('\n' + ex.stack) : ''))
  }

  if (delayTime === 0) {
    try {
      delayTime = client.timeUntilReconcile()
    } catch (ex) {
      delayTime = false
    }
    if (delayTime === false) delayTime = random.randomInt({ min: msecs.minute, max: 10 * msecs.minute })
  }
  if (delayTime > 0) {
    if (runTimeoutId) return

    active = client
    if (delayTime > (1 * msecs.hour)) delayTime = random.randomInt({ min: 3 * msecs.minute, max: msecs.hour })

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

/* code that may never be needed...

var rulesV2Reset = (callback) => {
  if (clientOptions.verboseP) console.log('\n\nreset rulesets')
  if (!v2RulesetDB) return

  if (client) {
    delete client.state.rulesV2Stamp
    client.state.updatesStamp = underscore.now()
  }
  v2RulesetDB.close((err) => {
    if (err) console.log(v2RulesetPath + ' close error: ' + err.toString())

    v2RulesetDB = null
    require('leveldown').destroy(pathName(v2RulesetPath), (err) => {
      if (err) console.log(v2RulesetPath + ' destroy error: ' + err.toString())

      v2RulesetDB = levelup(pathName(v2RulesetPath))
      callback()
    })
  })
}

*/

var getStateInfo = (state) => {
  var ballots, i, transaction
  var info = state.paymentInfo
  var then = underscore.now() - msecs.year

  ledgerInfo.paymentId = state.properties.wallet.paymentId
  ledgerInfo.passphrase = state.properties.wallet.keychains.passphrase

  ledgerInfo.created = !!state.properties.wallet
  ledgerInfo.creating = !ledgerInfo.created

  ledgerInfo.reconcileFrequency = state.properties.days
  ledgerInfo.reconcileStamp = state.reconcileStamp

  if (info) {
    ledgerInfo._internal.paymentInfo = info
    cacheReturnValue()
  }

  ledgerInfo.transactions = []
  if (!state.transactions) return updateLedgerInfo()

  for (i = state.transactions.length - 1; i >= 0; i--) {
    transaction = state.transactions[i]
    if (transaction.stamp < then) break

    if ((!transaction.ballots) || (transaction.ballots.length < transaction.count)) continue

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

  observeTransactions(state.transactions)
  updateLedgerInfo()
}

// Observe ledger client state.transactions for changes.
// Called by getStateInfo(). Updated state provided by ledger-client.
var cachedTransactions = null
var observeTransactions = (transactions) => {
  if (underscore.isEqual(cachedTransactions, transactions)) {
    return
  }
  // Notify the user of new transactions.
  if (getSetting(settings.PAYMENTS_NOTIFICATIONS) && cachedTransactions !== null) {
    const newTransactions = underscore.difference(transactions, cachedTransactions)
    if (newTransactions.length > 0) {
      const newestTransaction = newTransactions[newTransactions.length - 1]
      showNotificationPaymentDone(newestTransaction.contribution.fiat)
    }
  }
  cachedTransactions = underscore.clone(transactions)
}

var balanceTimeoutId = false

var getBalance = () => {
  if (!client) return

  balanceTimeoutId = setTimeout(getBalance, 1 * msecs.minute)
  if (!ledgerInfo.address) return

  if (!ledgerBalance) ledgerBalance = require('ledger-balance')
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
  var bravery

  if (!client) return

  try { bravery = client.getBraveryProperties() } catch (ex) {
// wallet being created...

    return setTimeout(function () { setPaymentInfo(amount) }, 2 * msecs.second)
  }

  amount = parseInt(amount, 10)
  if (isNaN(amount) || (amount <= 0)) return

  underscore.extend(bravery.fee, { amount: amount })
  client.setBraveryProperties(bravery, (err, result) => {
    if (err) return console.log('ledger setBraveryProperties: ' + err.toString())

    if (result) atomicWriter(pathName(statePath), result, { flushP: true }, () => {})
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

var networkConnected = underscore.debounce(() => {
  if (!client) return

  if (runTimeoutId) {
    clearTimeout(runTimeoutId)
    runTimeoutId = false
  }
  if (client.sync(callback) === true) run(random.randomInt({ min: msecs.minute, max: 10 * msecs.minute }))

  if (balanceTimeoutId) clearTimeout(balanceTimeoutId)
  balanceTimeoutId = setTimeout(getBalance, 5 * msecs.second)
}, 1 * msecs.minute, true)

/*
 * low-level utilities
 */

var syncingP = {}

var atomicWriter = (path, obj, options, cb) => {
  var data, suffix

  if (typeof options === 'function') {
    cb = options
    options = null
  }
  options = underscore.defaults(options || {}, { encoding: 'utf8', mode: parseInt('644', 8) })

  if ((!options.flushP) && (!syncingP[path])) syncingP[path] = true
  if (syncingP[path]) {
    syncingP[path] = { obj: obj, options: options, cb: cb }
    if (ledgerInfo._internal.debugP) console.log('\ndeferring ' + path)
    return
  }
  syncingP[path] = true

  data = JSON.stringify(obj, null, 2)
  suffix = '-' + crypto.createHash('md5').update(data).digest('hex')
  if (ledgerInfo._internal.debugP) console.log('\nwriting ' + path + suffix)
  fs.writeFile(path + suffix, data, options, (err) => {
    var deferred = syncingP[path]

    delete syncingP[path]
    if (typeof deferred === 'object') {
      if (ledgerInfo._internal.debugP) console.log('\nrestarting ' + path)
      return atomicWriter(path, deferred.obj, deferred.options, deferred.cb)
    }

    if (err) {
      console.log('write error: ' + err.toString())
      return cb(err)
    }

    if (ledgerInfo._internal.debugP) console.log('\nrenaming ' + path + suffix)
    fs.rename(path + suffix, path, (err) => {
      if (err) console.log('rename error: ' + err.toString())
      cb(err)
    })
  })
}

var doneWriter = () => {
  underscore.keys(syncingP).forEach((path) => {
    var deferred = syncingP[path]

    if (typeof deferred !== 'object') return

    delete syncingP[path]
    if (ledgerInfo._internal.debugP) console.log('\nflushing ' + path)
    deferred.options.flushP = true
    atomicWriter(path, deferred.obj, deferred.options, deferred.cb)
  })
}

var pathName = (name) => {
  var parts = path.parse(name)

  return path.join(app.getPath('userData'), parts.name + parts.ext)
}

/**
 * UI controller functionality
 */

const showNotifications = () => {
  if (getSetting(settings.PAYMENTS_ENABLED)) {
    if (getSetting(settings.PAYMENTS_NOTIFICATIONS)) showEnabledNotifications()
  } else {
    showDisabledNotifications()
  }
}

// When Payments is disabled
const showDisabledNotifications = () => {
  if (!getSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED)) {
    const firstRunTimestamp = appStore.getState().get('firstRunTimestamp')
    if (new Date().getTime() - firstRunTimestamp < appConfig.payments.delayNotificationTryPayments) {
      return
    }
    notificationTryPaymentsMessage = locale.translation('notificationTryPayments')
    appActions.showNotification({
      greeting: locale.translation('updateHello'),
      message: notificationTryPaymentsMessage,
      buttons: [
        {text: locale.translation('noThanks')},
        {text: locale.translation('notificationTryPaymentsYes'), className: 'primaryButton'}
      ],
      options: {
        style: 'greetingStyle',
        persist: false
      }
    })
  }
}

/**
* Show message that it's time to add funds if reconciliation is less than
* a day in the future and balance is too low.
* 24 hours prior to reconciliation, show message asking user to review
* their votes.
*/
const showEnabledNotifications = () => {
  const reconcileStamp = ledgerInfo.reconcileStamp

  if (!reconcileStamp) return

  if (reconcileStamp - underscore.now() < msecs.day) {
    if (sufficientBalanceToReconcile()) {
      if (shouldShowNotificationReviewPublishers()) {
        showNotificationReviewPublishers(reconcileStamp + ((ledgerInfo.reconcileFrequency - 2) * msecs.day))
      }
    } else if (shouldShowNotificationAddFunds()) {
      showNotificationAddFunds()
    }
  } else if (reconcileStamp - underscore.now() < 2 * msecs.day) {
    if (sufficientBalanceToReconcile() && (shouldShowNotificationReviewPublishers())) {
      showNotificationReviewPublishers(underscore.now() + msecs.day)
    }
  }
}

const sufficientBalanceToReconcile = () => {
  const balance = Number(ledgerInfo.balance || 0)
  const unconfirmed = Number(ledgerInfo.unconfirmed || 0)
  return ledgerInfo.btc &&
    (balance + unconfirmed > 0.9 * Number(ledgerInfo.btc))
}

const shouldShowNotificationAddFunds = () => {
  const nextTime = getSetting(settings.PAYMENTS_NOTIFICATION_ADD_FUNDS_TIMESTAMP)
  return !nextTime || (underscore.now() > nextTime)
}

const showNotificationAddFunds = () => {
  const nextTime = underscore.now() + (3 * msecs.day)
  appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_ADD_FUNDS_TIMESTAMP, nextTime)

  addFundsMessage = addFundsMessage || locale.translation('addFundsNotification')
  appActions.showNotification({
    greeting: locale.translation('updateHello'),
    message: addFundsMessage,
    buttons: [
      {text: locale.translation('turnOffNotifications')},
      {text: locale.translation('updateLater')},
      {text: locale.translation('addFunds'), className: 'primaryButton'}
    ],
    options: {
      style: 'greetingStyle',
      persist: false
    }
  })
}

const shouldShowNotificationReviewPublishers = () => {
  const nextTime = getSetting(settings.PAYMENTS_NOTIFICATION_RECONCILE_SOON_TIMESTAMP)
  return !nextTime || (underscore.now() > nextTime)
}

const showNotificationReviewPublishers = (nextTime) => {
  appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_RECONCILE_SOON_TIMESTAMP, nextTime)

  reconciliationMessage = reconciliationMessage || locale.translation('reconciliationNotification')
  appActions.showNotification({
    greeting: locale.translation('updateHello'),
    message: reconciliationMessage,
    buttons: [
      {text: locale.translation('turnOffNotifications')},
      {text: locale.translation('dismiss')},
      {text: locale.translation('reviewSites'), className: 'primaryButton'}
    ],
    options: {
      style: 'greetingStyle',
      persist: false
    }
  })
}

// Called from observeTransactions() when we see a new payment (transaction).
const showNotificationPaymentDone = (transactionContributionFiat) => {
  notificationPaymentDoneMessage = locale.translation('notificationPaymentDone')
    .replace(/{{\s*amount\s*}}/, transactionContributionFiat.amount)
    .replace(/{{\s*currency\s*}}/, transactionContributionFiat.currency)
  // Hide the 'waiting for deposit' message box if it exists
  appActions.hideNotification(addFundsMessage)
  appActions.showNotification({
    greeting: locale.translation('updateHello'),
    message: notificationPaymentDoneMessage,
    buttons: [
      {text: locale.translation('turnOffNotifications')},
      {text: locale.translation('Ok'), className: 'primaryButton'}
    ],
    options: {
      style: 'greetingStyle',
      persist: false
    }
  })
}

module.exports = {
  init: init,
  recoverKeys: recoverKeys,
  backupKeys: backupKeys,
  quit: quit,
  boot: boot
}
