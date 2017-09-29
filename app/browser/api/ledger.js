/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const acorn = require('acorn')
const moment = require('moment')
const Immutable = require('immutable')
const electron = require('electron')
const ipc = electron.ipcMain
const path = require('path')
const os = require('os')
const qr = require('qr-image')
const underscore = require('underscore')
const tldjs = require('tldjs')
const urlFormat = require('url').format
const queryString = require('queryString')
const levelUp = require('level')
const random = require('random-lib')
const uuid = require('uuid')

// Actions
const appActions = require('../../../js/actions/appActions')

// State
const ledgerState = require('../../common/state/ledgerState')
const pageDataState = require('../../common/state/pageDataState')

// Constants
const settings = require('../../../js/constants/settings')
const messages = require('../../../js/constants/messages')

// Utils
const tabs = require('../../browser/tabs')
const locale = require('../../locale')
const appConfig = require('../../../js/constants/appConfig')
const getSetting = require('../../../js/settings').getSetting
const {fileUrl} = require('../../../js/lib/appUrlUtil')
const urlParse = require('../../common/urlParse')
const ruleSolver = require('../../extensions/brave/content/scripts/pageInformation')
const request = require('../../../js/lib/request')
const ledgerUtil = require('../../common/lib/ledgerUtil')

// Caching
let locationDefault = 'NOOP'
let currentUrl = locationDefault
let currentTimestamp = new Date().getTime()
let visitsByPublisher = {}
let bootP
let quitP
let notificationPaymentDoneMessage
const _internal = {
  verboseP: true,
  debugP: true,
  ruleset: {
    raw: [],
    cooked: []
  }
}

// Libraries
let ledgerPublisher
let ledgerClient
let client
let synopsis
let ledgerBalance

// Timers
let balanceTimeoutId = false
let notificationTimeout
let runTimeoutId

// Database
let v2RulesetDB
const v2RulesetPath = 'ledger-rulesV2.leveldb'
let v2PublishersDB
const v2PublishersPath = 'ledger-publishersV2.leveldb'
const statePath = 'ledger-state.json'

// Definitions
const miliseconds = {
  year: 365 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000
}
const clientOptions = {
  debugP: process.env.LEDGER_DEBUG,
  loggingP: process.env.LEDGER_LOGGING,
  rulesTestP: process.env.LEDGER_RULES_TESTING,
  verboseP: process.env.LEDGER_VERBOSE,
  server: process.env.LEDGER_SERVER_URL,
  createWorker: electron.app.createWorker
}
const fileTypes = {
  bmp: new Buffer([0x42, 0x4d]),
  gif: new Buffer([0x47, 0x49, 0x46, 0x38, [0x37, 0x39], 0x61]),
  ico: new Buffer([0x00, 0x00, 0x01, 0x00]),
  jpeg: new Buffer([0xff, 0xd8, 0xff]),
  png: new Buffer([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
}

let signatureMax = 0
underscore.keys(fileTypes).forEach((fileType) => {
  if (signatureMax < fileTypes[fileType].length) signatureMax = fileTypes[fileType].length
})
signatureMax = Math.ceil(signatureMax * 1.5)

// TODO is it ok to have IPC here or is there better place
if (ipc) {
  ipc.on(messages.LEDGER_PUBLISHER, (event, location) => {
    if (!synopsis || event.sender.session === electron.session.fromPartition('default') || !tldjs.isValid(location)) {
      event.returnValue = {}
      return
    }

    let ctx = urlParse(location, true)
    ctx.TLD = tldjs.getPublicSuffix(ctx.host)
    if (!ctx.TLD) {
      if (_internal.verboseP) console.log('\nno TLD for:' + ctx.host)
      event.returnValue = {}
      return
    }

    ctx = underscore.mapObject(ctx, function (value) {
      if (!underscore.isFunction(value)) return value
    })
    ctx.URL = location
    ctx.SLD = tldjs.getDomain(ctx.host)
    ctx.RLD = tldjs.getSubdomain(ctx.host)
    ctx.QLD = ctx.RLD ? underscore.last(ctx.RLD.split('.')) : ''

    if (!event.sender.isDestroyed()) {
      event.sender.send(messages.LEDGER_PUBLISHER_RESPONSE + '-' + location, {
        context: ctx,
        rules: _internal.ruleset.cooked
      })
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
}

let ledgerPaymentsPresent = {}
const paymentPresent = (state, tabId, present) => {
  if (present) {
    ledgerPaymentsPresent[tabId] = present
  } else {
    delete ledgerPaymentsPresent[tabId]
  }

  if (Object.keys(ledgerPaymentsPresent).length > 0 && getSetting(settings.PAYMENTS_ENABLED)) {
    if (!balanceTimeoutId) {
      getBalance(state)
    }
  } else if (balanceTimeoutId) {
    clearTimeout(balanceTimeoutId)
    balanceTimeoutId = false
  }
}

const addFoundClosed = (state) => {
  if (balanceTimeoutId) {
    clearTimeout(balanceTimeoutId)
  }
  const balanceFn = getBalance.bind(null, state)
  balanceTimeoutId = setTimeout(balanceFn, 5 * miliseconds.second)
}

const boot = () => {
  if (bootP || client) {
    return
  }

  bootP = true
  const fs = require('fs')
  fs.access(pathName(statePath), fs.FF_OK, (err) => {
    if (!err) return

    if (err.code !== 'ENOENT') console.error('statePath read error: ' + err.toString())

    appActions.onBootStateFile()
  })
}

const onBootStateFile = (state) => {
  state = ledgerState.setInfoProp(state, 'creating', true)

  try {
    clientprep()
    client = ledgerClient(null, underscore.extend({roundtrip: roundtrip}, clientOptions), null)
  } catch (ex) {
    state = ledgerState.resetInfo(state)
    bootP = false
    return console.error('ledger client boot error: ', ex)
  }

  if (client.sync(callback) === true) {
    run(random.randomInt({min: miliseconds.minute, max: 10 * miliseconds.minute}))
  }

  getBalance(state)

  bootP = false

  return state
}

const promptForRecoveryKeyFile = () => {
  const defaultRecoveryKeyFilePath = path.join(electron.app.getPath('userData'), '/brave_wallet_recovery.txt')
  let files
  if (process.env.SPECTRON) {
    // skip the dialog for tests
    console.log(`for test, trying to recover keys from path: ${defaultRecoveryKeyFilePath}`)
    files = [defaultRecoveryKeyFilePath]
  } else {
    const dialog = electron.dialog
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

const logError = (state, err, caller) => {
  if (err) {
    console.error('Error in %j: %j', caller, err)
    state = ledgerState.setLedgerError(state, err, caller)
  } else {
    state = ledgerState.setLedgerError(state)
  }

  return state
}

const loadKeysFromBackupFile = (state, filePath) => {
  let keys = null
  const fs = require('fs')
  let data = fs.readFileSync(filePath)

  if (!data || !data.length || !(data.toString())) {
    state = logError(state, 'No data in backup file', 'recoveryWallet')
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
      state = logError(state, exc, 'recoveryWallet')
    }
  }

  return {
    state,
    keys
  }
}

const getPublisherData = (result, scorekeeper) => {
  let duration = result.duration

  let data = {
    verified: result.options.verified || false,
    site: result.publisherKey,
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
  data.publisherURL = (result.protocol || 'http:') + '//' + result.publisherKey

  if (duration >= miliseconds.day) {
    data.daysSpent = Math.max(Math.round(duration / miliseconds.day), 1)
  } else if (duration >= miliseconds.hour) {
    data.hoursSpent = Math.max(Math.floor(duration / miliseconds.hour), 1)
    data.minutesSpent = Math.round((duration % miliseconds.hour) / miliseconds.minute)
  } else if (duration >= miliseconds.minute) {
    data.minutesSpent = Math.max(Math.round(duration / miliseconds.minute), 1)
    data.secondsSpent = Math.round((duration % miliseconds.minute) / miliseconds.second)
  } else {
    data.secondsSpent = Math.max(Math.round(duration / miliseconds.second), 1)
  }

  return data
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

// courtesy of https://stackoverflow.com/questions/13483430/how-to-make-rounded-percentages-add-up-to-100#13485888
const roundToTarget = (l, target, property) => {
  let off = target - underscore.reduce(l, (acc, x) => { return acc + Math.round(x[property]) }, 0)

  return underscore.sortBy(l, (x) => Math.round(x[property]) - x[property])
    .map((x, i) => {
      x[property] = Math.round(x[property]) + (off > i) - (i >= (l.length + off))
      return x
    })
}

// TODO we should convert this function and all related ones into immutable
// TODO merge publishers and publisherData that is created in getPublisherData
// so that we don't need to create new Map every single time
const synopsisNormalizer = (state, changedPublisher) => {
  let dataPinned = [] // change to list
  let dataUnPinned = [] // change to list
  let dataExcluded = [] // change to list
  const scorekeeper = ledgerState.getSynopsisOption(state, 'scorekeeper')

  let results = []
  let publishers = ledgerState.getPublishers(state)
  for (let item of publishers) {
    const publisherKey = item[0]
    let publisher = item[1]
    if (!ledgerUtil.visibleP(state, publisherKey)) {
      continue
    }

    publisher = publisher.set('publisherKey', publisherKey)
    results.push(publisher.toJS())
  }

  if (results.length === 0) {
    return state
  }

  results = underscore.sortBy(results, (entry) => -entry.scores[scorekeeper])

  let pinnedTotal = 0
  let unPinnedTotal = 0
  // move publisher to the correct array and get totals
  results.forEach((result) => {
    if (result.pinPercentage && result.pinPercentage > 0) {
      // pinned
      pinnedTotal += result.pinPercentage
      dataPinned.push(getPublisherData(result, scorekeeper))
    } else if (ledgerUtil.stickyP(state, result.publisherKey)) {
      // unpinned
      unPinnedTotal += result.scores[scorekeeper]
      dataUnPinned.push(result)
    } else {
      // excluded
      let publisher = getPublisherData(result, scorekeeper)
      publisher.percentage = 0
      publisher.weight = 0
      dataExcluded.push(publisher)
    }
  })

  // round if over 100% of pinned publishers
  if (pinnedTotal > 100) {
    if (changedPublisher) {
      let changedObject = dataPinned.filter(publisher => publisher.site === changedPublisher)[0] // TOOD optimize to find from filter
      const setOne = changedObject.pinPercentage > (100 - dataPinned.length - 1)

      if (setOne) {
        changedObject.pinPercentage = 100 - dataPinned.length + 1
        changedObject.weight = changedObject.pinPercentage
      }

      const pinnedRestTotal = pinnedTotal - changedObject.pinPercentage
      dataPinned = dataPinned.filter(publisher => publisher.site !== changedPublisher)
      dataPinned = normalizePinned(dataPinned, pinnedRestTotal, (100 - changedObject.pinPercentage), setOne)
      dataPinned = roundToTarget(dataPinned, (100 - changedObject.pinPercentage), 'pinPercentage')

      dataPinned.push(changedObject)
    } else {
      dataPinned = normalizePinned(dataPinned, pinnedTotal, 100)
      dataPinned = roundToTarget(dataPinned, 100, 'pinPercentage')
    }

    dataUnPinned = dataUnPinned.map((result) => {
      let publisher = getPublisherData(result, scorekeeper)
      publisher.percentage = 0
      publisher.weight = 0
      return publisher
    })

    // sync app store
    state = ledgerState.changePinnedValues(state, dataPinned)
  } else if (dataUnPinned.length === 0 && pinnedTotal < 100) {
    // when you don't have any unpinned sites and pinned total is less then 100 %
    dataPinned = normalizePinned(dataPinned, pinnedTotal, 100, false)
    dataPinned = roundToTarget(dataPinned, 100, 'pinPercentage')

    // sync app store
    state = ledgerState.changePinnedValues(state, dataPinned)
  } else {
    // unpinned publishers
    dataUnPinned = dataUnPinned.map((result) => {
      let publisher = getPublisherData(result, scorekeeper)
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
    const publisherKey = item.site
    const weight = item.weight
    const pinPercentage = item.pinPercentage
    synopsis.publishers[publisherKey].weight = weight
    synopsis.publishers[publisherKey].pinPercentage = pinPercentage
    state = ledgerState.setPublishersProp(state, publisherKey, 'weight', weight)
    state = ledgerState.setPublishersProp(state, publisherKey, 'pinPercentage', pinPercentage)
  })

  return ledgerState.saveAboutSynopsis(state, newData)
}

const updatePublisherInfo = (state, changedPublisher) => {
  if (!getSetting(settings.PAYMENTS_ENABLED)) {
    return state
  }

  // const options = synopsis.options
  state = synopsisNormalizer(state, changedPublisher)

  return state
}

const inspectP = (db, path, publisher, property, key, callback) => {
  const done = (err, result) => {
    if (callback) {
      if (err) {
        callback(err, null)
        return
      }

      callback(err, result[property])
    }
  }

  if (!key) key = publisher
  db.get(key, (err, value) => {
    let result

    if (err) {
      if (!err.notFound) console.error(path + ' get ' + key + ' error: ' + JSON.stringify(err, null, 2))
      return done(err)
    }

    try {
      result = JSON.parse(value)
    } catch (ex) {
      console.error(v2RulesetPath + ' stream invalid JSON ' + key + ': ' + value)
      result = {}
    }

    done(null, result)
  })
}

// TODO rename function name
const verifiedP = (state, publisherKey, callback) => {
  inspectP(v2PublishersDB, v2PublishersPath, publisherKey, 'verified', null, (err, result) => {
    if (!err) {
      callback(null, result)
    }
  })

  if (process.env.NODE_ENV === 'test') {
    ['brianbondy.com', 'clifton.io'].forEach((key) => {
      if (ledgerState.hasPublisher(state, key)) {
        state = ledgerState.setPublisherOption(state, key, 'verified', true)
      }
    })
    state = updatePublisherInfo(state)
  }

  return state
}

// TODO rename function
const excludeP = (publisherKey, callback) => {
  let doneP

  const done = (err, result) => {
    doneP = true
    callback(err, result)
  }

  if (!v2RulesetDB) {
    return setTimeout(() => excludeP(publisherKey, callback), 5 * miliseconds.second)
  }

  inspectP(v2RulesetDB, v2RulesetPath, publisherKey, 'exclude', 'domain:' + publisherKey, (err, result) => {
    if (!err) {
      return done(err, result)
    }

    let props = ledgerPublisher.getPublisherProps('https://' + publisherKey)
    if (!props) return done()

    v2RulesetDB.createReadStream({lt: 'domain:'}).on('data', (data) => {
      if (doneP) return

      const sldP = data.key.indexOf('SLD:') === 0
      const tldP = data.key.indexOf('TLD:') === 0
      if (!tldP && !sldP) return

      if (underscore.intersection(data.key.split(''),
          ['^', '$', '*', '+', '?', '[', '(', '{', '|']).length === 0) {
        if (data.key !== ('TLD:' + props.TLD) && (props.SLD && data.key !== ('SLD:' + props.SLD.split('.')[0]))) {
          return
        }
      } else {
        try {
          const regexp = new RegExp(data.key.substr(4))
          if (!regexp.test(props[tldP ? 'TLD' : 'SLD'])) return
        } catch (ex) {
          console.error(v2RulesetPath + ' stream invalid regexp ' + data.key + ': ' + ex.toString())
        }
      }

      let result
      try {
        result = JSON.parse(data.value)
      } catch (ex) {
        console.error(v2RulesetPath + ' stream invalid JSON ' + data.entry + ': ' + data.value)
      }

      done(null, result.exclude)
    }).on('error', (err) => {
      console.error(v2RulesetPath + ' stream error: ' + JSON.stringify(err, null, 2))
    }).on('close', () => {
    }).on('end', () => {
      if (!doneP) done(null, false)
    })
  })
}

const setLocation = (state, timestamp, tabId) => {
  if (!synopsis) {
    return state
  }

  const locationData = ledgerState.getLocation(state, currentUrl)
  if (_internal.verboseP) {
    console.log(
      `locations[${currentUrl}]=${JSON.stringify(locationData, null, 2)} ` +
      `duration=${(timestamp - currentTimestamp)} msec tabId= ${tabId}`
    )
  }
  if (locationData.isEmpty() || !tabId) {
    return state
  }

  let publisherKey = locationData.get('publisher')
  if (!publisherKey) {
    return state
  }

  if (!visitsByPublisher[publisherKey]) {
    visitsByPublisher[publisherKey] = {}
  }

  if (!visitsByPublisher[publisherKey][currentUrl]) {
    visitsByPublisher[publisherKey][currentUrl] = {
      tabIds: []
    }
  }

  const revisitP = visitsByPublisher[publisherKey][currentUrl].tabIds.indexOf(tabId) !== -1
  if (!revisitP) {
    visitsByPublisher[publisherKey][currentUrl].tabIds.push(tabId)
  }

  let duration = timestamp - currentTimestamp
  if (_internal.verboseP) {
    console.log('\nadd publisher ' + publisherKey + ': ' + duration + ' msec' + ' revisitP=' + revisitP + ' state=' +
      JSON.stringify(underscore.extend({location: currentUrl}, visitsByPublisher[publisherKey][currentUrl]),
        null, 2))
  }

  synopsis.addPublisher(publisherKey, {duration: duration, revisitP: revisitP})
  state = ledgerState.setPublisher(state, publisherKey, synopsis.publishers[publisherKey])
  state = updatePublisherInfo(state)
  state = verifiedP(state, publisherKey, (error, result) => {
    if (!error) {
      appActions.onPublisherOptionUpdate(publisherKey, 'verified', result)
    }
  })

  return state
}

const addVisit = (state, location, timestamp, tabId) => {
  if (location === currentUrl) {
    return state
  }

  state = setLocation(state, timestamp, tabId)

  currentUrl = location.match(/^about/) ? locationDefault : location
  currentTimestamp = timestamp
  return state
}

const getFavIcon = (state, publisherKey, page) => {
  let publisher = ledgerState.getPublisher(state, publisherKey)
  const protocol = page.get('protocol')
  if (protocol && !publisher.get('protocol')) {
    publisher = publisher.set('protocol', protocol)
    state = ledgerState.setPublishersProp(state, publisherKey, 'protocol', protocol)
  }

  if (typeof publisher.get('faviconURL') === 'undefined' && (page.get('faviconURL') || publisher.get('protocol'))) {
    let faviconURL = page.get('faviconURL') || publisher.get('protocol') + '//' + urlParse(page.get('key')).host + '/favicon.ico'
    if (_internal.debugP) {
      console.log('\nrequest: ' + faviconURL)
    }

    state = ledgerState.setPublishersProp(state, publisherKey, 'faviconURL', null)
    fetchFavIcon(publisherKey, faviconURL)
  }

  return state
}

const fetchFavIcon = (publisherKey, url, redirects) => {
  if (typeof redirects === 'undefined') {
    redirects = 0
  }

  request.request({url: url, responseType: 'blob'}, (err, response, blob) => {
    let matchP, prefix, tail

    if (response && _internal.verboseP) {
      console.log('[ response for ' + url + ' ]')
      console.log('>>> HTTP/' + response.httpVersionMajor + '.' + response.httpVersionMinor + ' ' + response.statusCode +
        ' ' + (response.statusMessage || ''))
      underscore.keys(response.headers).forEach((header) => {
        console.log('>>> ' + header + ': ' + response.headers[header])
      })
      console.log('>>>')
      console.log('>>> ' + (blob || '').substr(0, 80))
    }

    if (_internal.debugP) {
      console.log('\nresponse: ' + url +
        ' errP=' + (!!err) + ' blob=' + (blob || '').substr(0, 80) + '\nresponse=' +
        JSON.stringify(response, null, 2))
    }

    if (err) {
      console.error('response error: ' + err.toString() + '\n' + err.stack)
      return null
    }

    if (response.statusCode === 301 && response.headers.location) {
      if (redirects < 3) fetchFavIcon(publisherKey, response.headers.location, redirects++)
      return null
    }

    if (response.statusCode !== 200 || response.headers['content-length'] === '0') {
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
        if (
          prefix.length >= fileTypes[fileType].length ||
          fileTypes[fileType].compare(prefix, 0, fileTypes[fileType].length) !== 0
        ) {
          return
        }

        blob = 'data:image/' + fileType + blob.substr(tail)
        matchP = true
      })
      if (!matchP) {
        return
      }
    } else if (tail > 0 && (tail + 8 >= blob.length)) return

    appActions.onFavIconReceived(publisherKey, blob)
  })
}

const updateLocation = (state, location, publisherKey) => {
  const locationData = ledgerState.getLocation(state, location)

  if (locationData.get('stickyP') == null) {
    state = ledgerState.setLocationProp(state, location, 'stickyP', ledgerUtil.stickyP(state, publisherKey))
  }

  if (locationData.get('verified') != null) {
    return state
  }

  const publisher = ledgerState.getPublisher(state, publisherKey)
  const verified = publisher.getIn(['options', 'verified'])
  if (verified != null) {
    state = ledgerState.setLocationProp(state, location, 'verified', (verified || false))
  } else {
    state = verifiedP(state, publisherKey, (err, result) => {
      if (err && !err.notFound) {
        return
      }

      const value = (result && result.verified) || false
      appActions.onLedgerLocationUpdate(location, 'verified', value)
    })
  }

  const exclude = publisher.getIn(['options', 'exclude'])
  if (exclude != null) {
    state = ledgerState.setLocationProp(state, location, 'exclude', (exclude || false))
  } else {
    excludeP(publisherKey, (err, result) => {
      if (err && !err.notFound) {
        return
      }

      const value = (result && result.exclude) || false
      appActions.onLedgerLocationUpdate(location, 'exclude', value)
    })
  }

  return state
}

const pageDataChanged = (state) => {
  // NB: in theory we have already seen every element in info except for (perhaps) the last one...
  let info = pageDataState.getLastInfo(state)

  if (!synopsis || info.isEmpty()) {
    return state
  }

  if (info.get('url', '').match(/^about/)) {
    return state
  }

  const location = info.get('key')
  const locationData = ledgerState.getLocation(state, location)
  let publisherKey = locationData.get('publisher')
  let publisher = ledgerState.getPublisher(state, publisherKey)
  if (!publisher.isEmpty()) {
    if (publisher.get('faviconURL') == null) {
      state = getFavIcon(state, publisherKey, info)
    }

    state = updateLocation(state, location, publisherKey)
  } else {
    try {
      publisherKey = ledgerPublisher.getPublisher(location, _internal.ruleset.raw)
      if (!publisherKey || (publisherKey && ledgerUtil.blockedP(state, publisherKey))) {
        publisherKey = null
      }
    } catch (ex) {
      console.error('getPublisher error for ' + location + ': ' + ex.toString())
    }

    state = ledgerState.setLocationProp(state, info.get('key'), 'publisher', publisherKey)
  }

  if (publisherKey && publisher.isEmpty()) {
    const initP = !ledgerState.hasPublisher(state, publisherKey)
    synopsis.initPublisher(publisherKey)

    if (synopsis.publishers[publisherKey]) {
      state = ledgerState.setPublisher(state, publisherKey, synopsis.publishers[publisherKey])
    }

    if (initP) {
      excludeP(publisherKey, (unused, exclude) => {
        if (!getSetting(settings.PAYMENTS_SITES_AUTO_SUGGEST)) {
          exclude = false
        } else {
          exclude = !exclude
        }
        appActions.onPublisherOptionUpdate(publisherKey, 'exclude', exclude, true)
      })
    }

    state = updateLocation(state, location, publisherKey)
    state = getFavIcon(state, publisherKey, info)
  }

  const pageLoad = pageDataState.getLoad(state)
  const view = pageDataState.getView(state)

  if (ledgerUtil.shouldTrackView(view, pageLoad)) {
    state = addVisit(
      state,
      view.get('url', locationDefault),
      view.get('timestamp', new Date().getTime()),
      view.get('tabId')
    )
  }

  return state
}

const backupKeys = (state, backupAction) => {
  const date = moment().format('L')
  const paymentId = ledgerState.getInfoProp(state, 'paymentId')
  const passphrase = ledgerState.getInfoProp(state, 'passphrase')

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
  const filePath = path.join(electron.app.getPath('userData'), '/brave_wallet_recovery.txt')

  const fs = require('fs')
  fs.writeFile(filePath, message, (err) => {
    if (err) {
      console.error(err)
    } else {
      tabs.create({url: fileUrl(filePath)}, (webContents) => {
        if (backupAction === 'print') {
          webContents.print({silent: false, printBackground: false})
        } else {
          webContents.downloadURL(fileUrl(filePath), true)
        }
      })
    }
  })
}

const recoverKeys = (state, useRecoveryKeyFile, firstKey, secondKey) => {
  let firstRecoveryKey, secondRecoveryKey

  if (useRecoveryKeyFile) {
    let recoveryKeyFile = promptForRecoveryKeyFile()
    if (!recoveryKeyFile) {
      // user canceled from dialog, we abort without error
      return state
    }

    if (recoveryKeyFile) {
      const result = loadKeysFromBackupFile(state, recoveryKeyFile)
      const keys = result.keys || {}
      state = result.state

      if (keys) {
        firstRecoveryKey = keys.paymentId
        secondRecoveryKey = keys.passphrase
      }
    }
  }

  if (!firstRecoveryKey || !secondRecoveryKey) {
    firstRecoveryKey = firstKey
    secondRecoveryKey = secondKey
  }

  const UUID_REGEX = /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/
  if (
    typeof firstRecoveryKey !== 'string' ||
    !firstRecoveryKey.match(UUID_REGEX) ||
    typeof secondRecoveryKey !== 'string' ||
    !secondRecoveryKey.match(UUID_REGEX)
  ) {
    // calling logError sets the error object
    state = logError(state, true, 'recoverKeys')
    state = ledgerState.setRecoveryStatus(state, false)
    return state
  }

  client.recoverWallet(firstRecoveryKey, secondRecoveryKey, (err, result) => {
    appActions.onWalletRecovery(err, result)
  })

  return state
}

const onWalletRecovery = (state, error, result) => {
  let existingLedgerError = ledgerState.getInfoProp(state, 'error')

  if (error) {
    // we reset ledgerInfo.error to what it was before (likely null)
    // if ledgerInfo.error is not null, the wallet info will not display in UI
    // logError sets ledgerInfo.error, so we must we clear it or UI will show an error
    state = logError(error, 'recoveryWallet')
    state = ledgerState.setInfoProp(state, 'error', existingLedgerError)
    state = ledgerState.setRecoveryStatus(state, false)
  } else {
    callback(error, result)

    if (balanceTimeoutId) {
      clearTimeout(balanceTimeoutId)
    }
    getBalance(state)
    state = ledgerState.setRecoveryStatus(state, true)
  }

  return state
}

const quit = (state) => {
  quitP = true
  state = addVisit(state, locationDefault, new Date().getTime(), null)

  if (!getSetting(settings.PAYMENTS_ENABLED) && getSetting(settings.SHUTDOWN_CLEAR_HISTORY)) {
    state = ledgerState.resetSynopsis(state)
  }

  return state
}

const initSynopsis = (state) => {
  state = ledgerState.saveSynopsis(state, null, synopsis.options)
  let value = getSetting(settings.PAYMENTS_MINIMUM_VISIT_TIME)
  if (!value) {
    value = 8 * 1000
    appActions.changeSetting(settings.PAYMENTS_MINIMUM_VISIT_TIME, value)
  }

  // for earlier versions of the code...
  if (value > 0 && value < 1000) {
    value = value * 1000
  }

  synopsis.options.minPublisherDuration = value
  state = ledgerState.setSynopsisOption(state, 'minPublisherDuration', value)

  value = getSetting(settings.PAYMENTS_MINIMUM_VISITS)
  if (!value) {
    value = 1
    appActions.changeSetting(settings.PAYMENTS_MINIMUM_VISITS, value)
  }

  if (value > 0) {
    synopsis.options.minPublisherVisits = value
    state = ledgerState.setSynopsisOption(state, 'minPublisherVisits', value)
  }

  if (process.env.NODE_ENV === 'test') {
    synopsis.options.minPublisherDuration = 0
    synopsis.options.minPublisherVisits = 0
    state = ledgerState.setSynopsisOption(state, 'minPublisherDuration', 0)
    state = ledgerState.setSynopsisOption(state, 'minPublisherVisits', 0)
  } else {
    if (process.env.LEDGER_PUBLISHER_MIN_DURATION) {
      value = ledgerClient.prototype.numbion(process.env.LEDGER_PUBLISHER_MIN_DURATION)
      synopsis.options.minPublisherDuration = value
      state = ledgerState.setSynopsisOption(state, 'minPublisherDuration', value)
    }
    if (process.env.LEDGER_PUBLISHER_MIN_VISITS) {
      value = ledgerClient.prototype.numbion(process.env.LEDGER_PUBLISHER_MIN_VISITS)
      synopsis.options.minPublisherVisits = value
      state = ledgerState.setSynopsisOption(state, 'minPublisherVisits', value)
    }
  }

  const publishers = ledgerState.getPublishers(state)
  for (let item of publishers) {
    const publisherKey = item[0]
    excludeP(publisherKey, (unused, exclude) => {
      appActions.onPublisherOptionUpdate(publisherKey, 'exclude', exclude)
    })

    state = verifiedP(state, publisherKey, (error, result) => {
      if (!error) {
        appActions.onPublisherOptionUpdate(publisherKey, 'verified', result)
      }
    })
  }

  state = updatePublisherInfo(state)

  return state
}

const enable = (state, paymentsEnabled) => {
  if (paymentsEnabled && !getSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED)) {
    appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED, true)
  }

  if (synopsis) {
    return updatePublisherInfo(state)
  }

  if (!ledgerPublisher) {
    ledgerPublisher = require('ledger-publisher')
  }
  synopsis = new (ledgerPublisher.Synopsis)()
  const stateSynopsis = ledgerState.getSynopsis(state)

  if (_internal.verboseP) {
    console.log('\nstarting up ledger publisher integration')
  }

  if (stateSynopsis.isEmpty()) {
    return initSynopsis(state)
  }

  try {
    synopsis = new (ledgerPublisher.Synopsis)(stateSynopsis.toJS())
  } catch (ex) {
    console.error('synopsisPath parse error: ' + ex.toString())
  }

  state = initSynopsis(state)

  // synopsis cleanup
  underscore.keys(synopsis.publishers).forEach((publisher) => {
    if (synopsis.publishers[publisher].faviconURL === null) {
      delete synopsis.publishers[publisher].faviconURL
    }
  })

  // change undefined include publishers to include publishers
  state = ledgerState.enableUndefinedPublishers(state, stateSynopsis.get('publishers'))

  return state
}

const pathName = (name) => {
  const parts = path.parse(name)
  return path.join(electron.app.getPath('userData'), parts.name + parts.ext)
}

const sufficientBalanceToReconcile = (state) => {
  const balance = Number(ledgerState.getInfoProp(state, 'balance') || 0)
  const unconfirmed = Number(ledgerState.getInfoProp(state, 'unconfirmed') || 0)
  const btc = ledgerState.getInfoProp(state, 'btc')
  return btc && (balance + unconfirmed > 0.9 * Number(btc))
}

const shouldShowNotificationReviewPublishers = () => {
  const nextTime = getSetting(settings.PAYMENTS_NOTIFICATION_RECONCILE_SOON_TIMESTAMP)
  return !nextTime || (new Date().getTime() > nextTime)
}

const shouldShowNotificationAddFunds = () => {
  const nextTime = getSetting(settings.PAYMENTS_NOTIFICATION_ADD_FUNDS_TIMESTAMP)
  return !nextTime || (new Date().getTime() > nextTime)
}

const showNotificationReviewPublishers = (nextTime) => {
  appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_RECONCILE_SOON_TIMESTAMP, nextTime)

  appActions.showNotification({
    greeting: locale.translation('updateHello'),
    message: locale.translation('reconciliationNotification'),
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

const showNotificationAddFunds = () => {
  const nextTime = new Date().getTime() + (3 * miliseconds.day)
  appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_ADD_FUNDS_TIMESTAMP, nextTime)

  appActions.showNotification({
    greeting: locale.translation('updateHello'),
    message: locale.translation('addFundsNotification'),
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

/**
 * Show message that it's time to add funds if reconciliation is less than
 * a day in the future and balance is too low.
 * 24 hours prior to reconciliation, show message asking user to review
 * their votes.
 */
const showEnabledNotifications = (state) => {
  const reconcileStamp = ledgerState.getInfoProp(state, 'reconcileStamp')

  if (!reconcileStamp) {
    return
  }

  if (reconcileStamp - new Date().getTime() < miliseconds.day) {
    if (sufficientBalanceToReconcile(state)) {
      if (shouldShowNotificationReviewPublishers()) {
        const reconcileFrequency = ledgerState.getInfoProp(state, 'reconcileFrequency')
        showNotificationReviewPublishers(reconcileStamp + ((reconcileFrequency - 2) * miliseconds.day))
      }
    } else if (shouldShowNotificationAddFunds()) {
      showNotificationAddFunds()
    }
  } else if (reconcileStamp - new Date().getTime() < 2 * miliseconds.day) {
    if (sufficientBalanceToReconcile(state) && (shouldShowNotificationReviewPublishers())) {
      showNotificationReviewPublishers(new Date().getTime() + miliseconds.day)
    }
  }
}

const showDisabledNotifications = (state) => {
  if (!getSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED)) {
    const firstRunTimestamp = state.get('firstRunTimestamp')
    if (new Date().getTime() - firstRunTimestamp < appConfig.payments.delayNotificationTryPayments) {
      return
    }

    appActions.showNotification({
      greeting: locale.translation('updateHello'),
      message: locale.translation('notificationTryPayments'),
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

const showNotifications = (state) => {
  if (getSetting(settings.PAYMENTS_ENABLED)) {
    if (getSetting(settings.PAYMENTS_NOTIFICATIONS)) {
      showEnabledNotifications(state)
    }
  } else {
    showDisabledNotifications(state)
  }
}

const cacheRuleSet = (state, ruleset) => {
  if (!ruleset || underscore.isEqual(_internal.ruleset.raw, ruleset)) {
    return state
  }

  try {
    let stewed = []
    ruleset.forEach((rule) => {
      let entry = {condition: acorn.parse(rule.condition)}

      if (rule.dom) {
        if (rule.dom.publisher) {
          entry.publisher = {
            selector: rule.dom.publisher.nodeSelector,
            consequent: acorn.parse(rule.dom.publisher.consequent)
          }
        }
        if (rule.dom.faviconURL) {
          entry.faviconURL = {
            selector: rule.dom.faviconURL.nodeSelector,
            consequent: acorn.parse(rule.dom.faviconURL.consequent)
          }
        }
      }
      if (!entry.publisher) entry.consequent = rule.consequent ? acorn.parse(rule.consequent) : rule.consequent

      stewed.push(entry)
    })

    _internal.ruleset.raw = ruleset
    _internal.ruleset.cooked = stewed
    if (!synopsis) {
      return state
    }

    let syncP = false
    const publishers = ledgerState.getPublishers(state)
    for (let item of publishers) {
      const publisherKey = item[0]
      const publisher = item[1]
      const location = (publisher.get('protocol') || 'http:') + '//' + publisherKey
      let ctx = urlParse(location)

      ctx.TLD = tldjs.getPublicSuffix(ctx.host)
      if (!ctx.TLD) {
        return state
      }

      ctx = underscore.mapObject(ctx, function (value) {
        if (!underscore.isFunction(value)) return value
      })
      ctx.URL = location
      ctx.SLD = tldjs.getDomain(ctx.host)
      ctx.RLD = tldjs.getSubdomain(ctx.host)
      ctx.QLD = ctx.RLD ? underscore.last(ctx.RLD.split('.')) : ''

      stewed.forEach((rule) => {
        if (rule.consequent !== null || rule.dom) return
        if (!ruleSolver.resolve(rule.condition, ctx)) return

        if (_internal.verboseP) console.log('\npurging ' + publisherKey)
        delete synopsis.publishers[publisher]
        state = ledgerState.deletePublishers(state, publisherKey)
        syncP = true
      })
    }

    if (!syncP) {
      return state
    }

    return updatePublisherInfo(state)
  } catch (ex) {
    console.error('ruleset error: ', ex)
    return state
  }
}

const clientprep = () => {
  if (!ledgerClient) ledgerClient = require('ledger-client')
  _internal.debugP = ledgerClient.prototype.boolion(process.env.LEDGER_PUBLISHER_DEBUG)
  _internal.verboseP = ledgerClient.prototype.boolion(process.env.LEDGER_PUBLISHER_VERBOSE)
}

const roundtrip = (params, options, callback) => {
  let parts = typeof params.server === 'string' ? urlParse(params.server)
    : typeof params.server !== 'undefined' ? params.server
      : typeof options.server === 'string' ? urlParse(options.server) : options.server
  const rawP = options.rawP

  if (!params.method) params.method = 'GET'
  parts = underscore.extend(underscore.pick(parts, ['protocol', 'hostname', 'port']),
    underscore.omit(params, ['headers', 'payload', 'timeout']))

// TBD: let the user configure this via preferences [MTR]
  if (parts.hostname === 'ledger.brave.com' && params.useProxy) {
    parts.hostname = 'ledger-proxy.privateinternetaccess.com'
  }

  const i = parts.path.indexOf('?')
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
    headers: underscore.defaults(params.headers || {}, {'content-type': 'application/json; charset=utf-8'}),
    verboseP: options.verboseP
  }
  request.request(options, (err, response, body) => {
    let payload

    if (response && options.verboseP) {
      console.log('[ response for ' + params.method + ' ' + parts.protocol + '//' + parts.hostname + params.path + ' ]')
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
  underscore.keys(options.headers).forEach((header) => {
    console.log('<<< ' + header + ': ' + options.headers[header])
  })
  console.log('<<<')
  if (options.payload) console.log('<<< ' + JSON.stringify(params.payload, null, 2).split('\n').join('\n<<< '))
}

const updateLedgerInfo = (state) => {
  const ledgerInfo = ledgerState.getInfoProps(state)
  const now = new Date().getTime()

  if (ledgerInfo.get('buyURLExpires') > now) {
    state = ledgerState.setInfoProp(state, 'buyMaximumUSD', 6)
  }
  if (typeof process.env.ADDFUNDS_URL !== 'undefined') {
    state = ledgerState.setInfoProp(state, 'buyURLFrame', true)
    const buyURL = process.env.ADDFUNDS_URL + '?' +
      queryString.stringify({
        currency: ledgerInfo.get('currency'),
        amount: getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT),
        address: ledgerInfo.get('address')
      })
    state = ledgerState.setInfoProp(state, 'buyURL', buyURL)
    state = ledgerState.setInfoProp(state, 'buyMaximumUSD', false)
  }

  // TODO remove when BAT is implemented, we don't need this for BAT
  /*
  if ((client) && (now > ledgerInfo._internal.geoipExpiry)) {
    ledgerInfo._internal.geoipExpiry = now + (5 * miliseconds.minute)

    if (!ledgerGeoIP) ledgerGeoIP = require('ledger-geoip')
    return ledgerGeoIP.getGeoIP(client.options, (err, provider, result) => {
      if (err) console.warn('ledger geoip warning: ' + JSON.stringify(err, null, 2))
      if (result) ledgerInfo.countryCode = result

      ledgerInfo.exchangeInfo = ledgerInfo._internal.exchanges[ledgerInfo.countryCode]

      if (now <= ledgerInfo._internal.exchangeExpiry) return updateLedgerInfo()

      ledgerInfo._internal.exchangeExpiry = now + miliseconds.day
      roundtrip({ path: '/v1/exchange/providers' }, client.options, (err, response, body) => {
        if (err) console.error('ledger exchange error: ' + JSON.stringify(err, null, 2))

        ledgerInfo._internal.exchanges = body || {}
        ledgerInfo.exchangeInfo = ledgerInfo._internal.exchanges[ledgerInfo.countryCode]
        updateLedgerInfo()
      })
    })
  }
  */

  return state
}

// Called from observeTransactions() when we see a new payment (transaction).
const showNotificationPaymentDone = (transactionContributionFiat) => {
  notificationPaymentDoneMessage = locale.translation('notificationPaymentDone')
    .replace(/{{\s*amount\s*}}/, transactionContributionFiat.amount)
    .replace(/{{\s*currency\s*}}/, transactionContributionFiat.currency)
  // Hide the 'waiting for deposit' message box if it exists
  appActions.hideNotification(locale.translation('addFundsNotification'))
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

const observeTransactions = (state, transactions) => {
  const current = ledgerState.getInfoProp(state, 'transactions')
  if (current && current.size === transactions.length) {
    return
  }
  // Notify the user of new transactions.
  if (getSetting(settings.PAYMENTS_NOTIFICATIONS)) {
    if (transactions.length > 0) {
      const newestTransaction = transactions[transactions.length - 1]
      showNotificationPaymentDone(newestTransaction.contribution.fiat)
    }
  }
}

// TODO convert this function and related ones to immutable
const getStateInfo = (state, parsedData) => {
  const info = parsedData.paymentInfo
  const then = new Date().getTime() - miliseconds.year

  if (!parsedData.properties.wallet) {
    return state
  }

  const newInfo = {
    paymentId: parsedData.properties.wallet.paymentId,
    passphrase: parsedData.properties.wallet.keychains.passphrase,
    created: !!parsedData.properties.wallet,
    creating: !parsedData.properties.wallet,
    reconcileFrequency: parsedData.properties.days,
    reconcileStamp: parsedData.reconcileStamp
  }

  state = ledgerState.mergeInfoProp(state, newInfo)

  if (info) {
    state = ledgerState.mergeInfoProp(state, info)
    state = generatePaymentData(state)
  }

  let transactions = []
  if (!parsedData.transactions) {
    return updateLedgerInfo(state)
  }

  for (let i = parsedData.transactions.length - 1; i >= 0; i--) {
    let transaction = parsedData.transactions[i]
    if (transaction.stamp < then) break

    if (!transaction.ballots || transaction.ballots.length < transaction.count) continue

    let ballots = underscore.clone(transaction.ballots || {})
    parsedData.ballots.forEach((ballot) => {
      if (ballot.viewingId !== transaction.viewingId) return

      if (!ballots[ballot.publisher]) ballots[ballot.publisher] = 0
      ballots[ballot.publisher]++
    })

    transactions.push(underscore.extend(underscore.pick(transaction,
      ['viewingId', 'contribution', 'submissionStamp', 'count']),
      {ballots: ballots}))
  }

  observeTransactions(state, transactions)
  state = ledgerState.setInfoProp(state, 'transactions', Immutable.fromJS(transactions))
  return updateLedgerInfo(state)
}

const generatePaymentData = (state) => {
  const ledgerInfo = ledgerState.getInfoProps(state)
  const paymentURL = `bitcoin:${ledgerInfo.get('address')}?amount=${ledgerInfo.get('btc')}&label=${encodeURI('Brave Software')}`
  if (ledgerInfo.get('paymentURL') !== paymentURL) {
    state = ledgerState.setInfoProp(state, 'paymentURL', paymentURL)
    try {
      let chunks = []
      qr.image(paymentURL, {type: 'png'})
        .on('data', (chunk) => {
          chunks.push(chunk)
        })
        .on('end', () => {
          const paymentIMG = 'data:image/png;base64,' + Buffer.concat(chunks).toString('base64')
          state = ledgerState.setInfoProp(state, 'paymentIMG', paymentIMG)
        })
    } catch (ex) {
      console.error('qr.imageSync error: ' + ex.toString())
    }
  }

  return state
}

const getPaymentInfo = (state) => {
  let amount, currency

  if (!client) return

  try {
    const bravery = client.getBraveryProperties()
    state = ledgerState.setInfoProp(state, 'bravery', Immutable.fromJS(bravery))
    if (bravery.fee) {
      amount = bravery.fee.amount
      currency = bravery.fee.currency
    }

    client.getWalletProperties(amount, currency, function (err, body) {
      if (err) {
        logError(err, 'getWalletProperties')
        return
      }

      appActions.onWalletProperties(body)
    })
  } catch (ex) {
    console.error('properties error: ' + ex.toString())
  }

  return state
}

const onWalletProperties = (state, body) => {
  let newInfo = {
    buyURL: body.get('buyURL'),
    buyURLExpires: body.get('buyURLExpires'),
    balance: body.get('balance'),
    unconfirmed: body.get('unconfirmed'),
    satoshis: body.get('satoshis'),
    address: client.getWalletAddress()
  }

  state = ledgerState.mergeInfoProp(state, newInfo)

  const info = ledgerState.getInfoProps(state)

  const amount = info.getIn(['bravery', 'fee', 'amount'])
  const currency = info.getIn(['bravery', 'fee', 'currency'])

  if (amount && currency) {
    const bodyCurrency = body.getIn(['rates', 'currency'])
    if (bodyCurrency) {
      const btc = (amount / bodyCurrency).toFixed(8)
      state = ledgerState.setInfoProp(state, 'btc', btc)
    }
  }

  state = generatePaymentData(state)

  return state
}

const setPaymentInfo = (amount) => {
  let bravery

  if (!client) return

  try {
    bravery = client.getBraveryProperties()
  } catch (ex) {
    // wallet being created...
    return setTimeout(function () {
      setPaymentInfo(amount)
    }, 2 * miliseconds.second)
  }

  amount = parseInt(amount, 10)
  if (isNaN(amount) || (amount <= 0)) return

  underscore.extend(bravery.fee, {amount: amount})
  client.setBraveryProperties(bravery, (err, result) => {
    if (err) {
      err = err.toString()
    }

    appActions.onBraveryProperties(err, result)
  })
}

const onBraveryProperties = (state, error, result) => {
  const created = ledgerState.getInfoProp(state, 'created')
  if (created) {
    state = getPaymentInfo(state)
  }

  if (error) {
    console.error('ledger setBraveryProperties: ' + error)
    return state
  }

  if (result) {
    muonWriter(pathName(statePath), result)
  }

  return state
}

const getBalance = (state) => {
  if (!client) return

  const address = ledgerState.getInfoProp(state, 'address')
  const balanceFn = getBalance.bind(null, state)
  balanceTimeoutId = setTimeout(balanceFn, 1 * miliseconds.minute)
  if (!address) {
    return
  }

  if (!ledgerBalance) ledgerBalance = require('ledger-balance')
  ledgerBalance.getBalance(address, underscore.extend({balancesP: true}, client.options),
    (err, provider, result) => {
      if (err) {
        return console.warn('ledger balance warning: ' + JSON.stringify(err, null, 2))
      }
      appActions.onLedgerBalanceReceived(result.unconfirmed)
    })
}

const balanceReceived = (state, unconfirmed) => {
  if (typeof unconfirmed === 'undefined') return

  if (unconfirmed > 0) {
    const result = (unconfirmed / 1e8).toFixed(4)
    if (ledgerState.getInfoProp(state, 'unconfirmed') === result) {
      return state
    }

    state = ledgerState.setInfoProp(state, 'unconfirmed', result)
    if (clientOptions.verboseP) {
      console.log('\ngetBalance refreshes ledger info: ' + ledgerState.getInfoProp(state, 'unconfirmed'))
    }
    return updateLedgerInfo(state)
  }

  if (ledgerState.getInfoProp(state, 'unconfirmed') === '0.0000') {
    return state
  }

  if (clientOptions.verboseP) console.log('\ngetBalance refreshes payment info')
  return getPaymentInfo(state)
}

const callback = (err, result, delayTime) => {
  if (clientOptions.verboseP) {
    console.log('\nledger client callback: clientP=' + (!!client) + ' errP=' + (!!err) + ' resultP=' + (!!result) +
      ' delayTime=' + delayTime)
  }

  if (err) {
    console.log('ledger client error(1): ' + JSON.stringify(err, null, 2) + (err.stack ? ('\n' + err.stack) : ''))
    if (!client) return

    if (typeof delayTime === 'undefined') {
      delayTime = random.randomInt({min: miliseconds.minute, max: 10 * miliseconds.minute})
    }
  }

  appActions.onLedgerCallback(result, delayTime)
}

const onCallback = (state, result, delayTime) => {
  let results
  let entries = client && client.report()

  if (!result) {
    return run(state, delayTime)
  }

  const regularResults = result.toJS()

  if (client && result.getIn(['properties', 'wallet'])) {
    if (!ledgerState.getInfoProp(state, 'created')) {
      setPaymentInfo(getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT))
    }

    state = getStateInfo(state, regularResults) // TODO optimize if possible
    state = getPaymentInfo(state)
  }

  state = cacheRuleSet(state, regularResults.ruleset)
  if (result.has('rulesetV2')) {
    results = regularResults.rulesetV2 // TODO optimize if possible
    result = result.delete('rulesetV2')

    entries = []
    results.forEach((entry) => {
      const key = entry.facet + ':' + entry.publisher

      if (entry.exclude !== false) {
        entries.push({type: 'put', key: key, value: JSON.stringify(underscore.omit(entry, ['facet', 'publisher']))})
      } else {
        entries.push({type: 'del', key: key})
      }
    })

    v2RulesetDB.batch(entries, (err) => {
      if (err) return console.error(v2RulesetPath + ' error: ' + JSON.stringify(err, null, 2))

      if (entries.length === 0) return

      const publishers = ledgerState.getPublishers(state)
      for (let item of publishers) {
        const publisherKey = item[0]
        excludeP(publisherKey, (unused, exclude) => {
          appActions.onPublisherOptionUpdate(publisherKey, 'exclude', exclude)
        })
      }
    })
  }

  if (result.has('publishersV2')) {
    results = regularResults.publishersV2 // TODO optimize if possible
    result = result.delete('publishersV2')

    entries = []
    results.forEach((entry) => {
      const publisherKey = entry.publisher
      entries.push({
        type: 'put',
        key: publisherKey,
        value: JSON.stringify(underscore.omit(entry, ['publisher']))
      })
      const publisher = ledgerState.getPublisher(state, publisherKey)
      const newValue = entry.verified
      if (!publisher.isEmpty() && publisher.getIn(['options', 'verified']) !== newValue) {
        synopsis.publishers[publisherKey].options.verified = newValue
        state = ledgerState.setPublisherOption(state, publisherKey, 'verified', newValue)
      }
    })
    state = updatePublisherInfo(state)
    v2PublishersDB.batch(entries, (err) => {
      if (err) return console.error(v2PublishersPath + ' error: ' + JSON.stringify(err, null, 2))
    })
  }

  muonWriter(pathName(statePath), regularResults)
  run(state, delayTime)

  return state
}

const initialize = (state, paymentsEnabled) => {
  if (!v2RulesetDB) v2RulesetDB = levelUp(pathName(v2RulesetPath))
  if (!v2PublishersDB) v2PublishersDB = levelUp(pathName(v2PublishersPath))
  state = enable(state, paymentsEnabled)

  // Check if relevant browser notifications should be shown every 15 minutes
  if (notificationTimeout) {
    clearInterval(notificationTimeout)
  }
  notificationTimeout = setInterval((state) => {
    showNotifications(state)
  }, 15 * miliseconds.minute, state)

  if (!paymentsEnabled) {
    client = null
    return ledgerState.resetInfo(state)
  }

  if (client) {
    return state
  }

  if (!ledgerPublisher) ledgerPublisher = require('ledger-publisher')
  let ruleset = []
  ledgerPublisher.ruleset.forEach(rule => {
    if (rule.consequent) ruleset.push(rule)
  })
  state = cacheRuleSet(state, ruleset)

  try {
    const fs = require('fs')
    fs.accessSync(pathName(statePath), fs.FF_OK)
    const data = fs.readFileSync(pathName(statePath))
    let parsedData

    try {
      parsedData = JSON.parse(data)
      if (clientOptions.verboseP) {
        console.log('\nstarting up ledger client integration')
      }
    } catch (ex) {
      console.error('statePath parse error: ' + ex.toString())
      return state
    }

    state = getStateInfo(state, parsedData)

    try {
      let timeUntilReconcile
      clientprep()
      client = ledgerClient(parsedData.personaId,
        underscore.extend(parsedData.options, {roundtrip: roundtrip}, clientOptions),
        parsedData)

      // Scenario: User enables Payments, disables it, waits 30+ days, then
      // enables it again -> reconcileStamp is in the past.
      // In this case reset reconcileStamp to the future.
      try {
        timeUntilReconcile = client.timeUntilReconcile()
      } catch (ex) {}

      let ledgerWindow = (ledgerState.getSynopsisOption(state, 'numFrames') - 1) * ledgerState.getSynopsisOption(state, 'frameSize')
      if (typeof timeUntilReconcile === 'number' && timeUntilReconcile < -ledgerWindow) {
        client.setTimeUntilReconcile(null, (err, stateResult) => {
          if (err) return console.error('ledger setTimeUntilReconcile error: ' + err.toString())

          if (!stateResult) {
            return
          }

          appActions.onTimeUntilReconcile(stateResult)
        })
      }
    } catch (ex) {
      return console.error('ledger client creation error: ', ex)
    }

    // speed-up browser start-up by delaying the first synchronization action
    setTimeout(() => {
      if (!client) {
        return
      }

      appActions.onLedgerFirstSync(parsedData)
    }, 3 * miliseconds.second)

    // Make sure bravery props are up-to-date with user settings
    const address = ledgerState.getInfoProp(state, 'address')
    if (address) {
      state = ledgerState.setInfoProp(state, 'address', client.getWalletAddress())
    }

    setPaymentInfo(getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT))
    getBalance(state)

    return state
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('statePath read error: ' + err.toString())
    }
    state = ledgerState.resetInfo(state)
    return state
  }
}

const onTimeUntilReconcile = (state, stateResult) => {
  state = getStateInfo(stateResult)
  muonWriter(pathName(statePath), stateResult)

  return state
}

const onLedgerFirstSync = (state, parsedData) => {
  if (client.sync(callback) === true) {
    run(state, random.randomInt({min: miliseconds.minute, max: 10 * miliseconds.minute}))
  }

  return cacheRuleSet(state, parsedData.ruleset)
}

const init = (state) => {
  return initialize(state, getSetting(settings.PAYMENTS_ENABLED))
}

const run = (state, delayTime) => {
  if (clientOptions.verboseP) {
    console.log('\nledger client run: clientP=' + (!!client) + ' delayTime=' + delayTime)

    const line = (fields) => {
      let result = ''

      fields.forEach((field) => {
        const max = (result.length > 0) ? 9 : 19

        if (typeof field !== 'string') field = field.toString()
        if (field.length < max) {
          let spaces = ' '.repeat(max - field.length)
          field = spaces + field
        } else {
          field = field.substr(0, max)
        }
        result += ' ' + field
      })

      console.log(result.substr(1))
    }

    line(['publisher',
      'blockedP', 'stickyP', 'verified',
      'excluded', 'eligibleP', 'visibleP',
      'contribP',
      'duration', 'visits'
    ])
    let entries = synopsis.topN() || []
    entries.forEach((entry) => {
      const publisherKey = entry.publisher
      const publisher = ledgerState.getPublisher(state, publisherKey)

      line([publisherKey,
        ledgerUtil.blockedP(state, publisherKey), ledgerUtil.stickyP(state, publisherKey), publisher.getIn(['options', 'verified']) === true,
        publisher.getIn(['options', 'exclude']) === true, ledgerUtil.eligibleP(state, publisherKey), ledgerUtil.visibleP(state, publisherKey),
        ledgerUtil.contributeP(state, publisherKey),
        Math.round(publisher.get('duration') / 1000), publisher.get('visits')])
    })
  }

  if (typeof delayTime === 'undefined' || !client) {
    return
  }

  let winners
  const ballots = client.ballots()
  const data = (synopsis) && (ballots > 0) && synopsisNormalizer(state)

  if (data) {
    let weights = []
    data.forEach((datum) => {
      weights.push({publisher: datum.site, weight: datum.weight / 100.0})
    })
    winners = synopsis.winners(ballots, weights)
  }

  if (!winners) winners = []

  try {
    let stateData
    winners.forEach((winner) => {
      if (!ledgerUtil.contributeP(state, winner)) return

      const result = client.vote(winner)
      if (result) stateData = result
    })
    if (stateData) muonWriter(pathName(statePath), stateData)
  } catch (ex) {
    console.log('ledger client error(2): ' + ex.toString() + (ex.stack ? ('\n' + ex.stack) : ''))
  }

  if (delayTime === 0) {
    try {
      delayTime = client.timeUntilReconcile()
    } catch (ex) {
      delayTime = false
    }
    if (delayTime === false) {
      delayTime = random.randomInt({min: miliseconds.minute, max: 10 * miliseconds.minute})
    }
  }

  if (delayTime > 0) {
    if (runTimeoutId) return

    const active = client
    if (delayTime > (1 * miliseconds.hour)) {
      delayTime = random.randomInt({min: 3 * miliseconds.minute, max: miliseconds.hour})
    }

    runTimeoutId = setTimeout(() => {
      runTimeoutId = false
      if (active !== client) return

      if (!client) {
        return console.log('\n\n*** MTR says this can\'t happen(1)... please tell him that he\'s wrong!\n\n')
      }

      if (client.sync(callback) === true) {
        appActions.onLedgerRun(0)
      }
    }, delayTime)
    return
  }

  if (client.isReadyToReconcile()) {
    client.reconcile(uuid.v4().toLowerCase(), callback)
  }
}

const networkConnected = () => {
  underscore.debounce(() => {
    if (!client) return

    appActions.onNetworkConnected()
  }, 1 * miliseconds.minute, true)
}

const onNetworkConnected = (state) => {
  if (runTimeoutId) {
    clearTimeout(runTimeoutId)
    runTimeoutId = false
  }

  if (client.sync(callback) === true) {
    const delayTime = random.randomInt({min: miliseconds.minute, max: 10 * miliseconds.minute})
    run(state, delayTime)
  }

  if (balanceTimeoutId) clearTimeout(balanceTimeoutId)
  const newBalance = getBalance.bind(null, state)
  balanceTimeoutId = setTimeout(newBalance, 5 * miliseconds.second)
}

const muonWriter = (path, payload) => {
  muon.file.writeImportant(path, JSON.stringify(payload, null, 2), (success) => {
    if (!success) return console.error('write error: ' + path)

    if (quitP && (!getSetting(settings.PAYMENTS_ENABLED) && getSetting(settings.SHUTDOWN_CLEAR_HISTORY))) {
      const fs = require('fs')
      return fs.unlink(path, (err) => {
        if (err) console.error('unlink error: ' + err.toString())
      })
    }
  })
}

const migration = (state) => {
  const synopsisPath = 'ledger-synopsis.json'

  const synopsisOptions = ledgerState.getSynopsisOptions(state)

  if (getSetting(settings.PAYMENTS_ENABLED) && synopsisOptions.isEmpty()) {
    // Move data from synopsis file into appState
    const fs = require('fs')
    try {
      fs.accessSync(pathName(synopsisPath), fs.FF_OK)
      const data = fs.readFileSync(pathName(synopsisPath))
      const parsed = JSON.parse(data)
      state = ledgerState.saveSynopsis(state, parsed.publishers, parsed.options)
      fs.unlink(pathName(synopsisPath), (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('error removing file ' + synopsisPath + ': ', err)
        }
      })
    } catch (err) {
      console.log('Error migrating file', err.toString())
    }

    // Delete ledgerInfo
    state = state.delete('ledgerInfo')

    // Move locationInfo into ledger
    if (state.has('locationInfo')) {
      const locationInfo = state.get('locationInfo')
      state = state.setIn(['ledger', 'locations'], locationInfo)
      state = state.delete('locationInfo')
    }
  }

  return state
}

// for synopsis variable handling only
const deleteSynopsis = (publisherKey) => {
  delete synopsis.publishers[publisherKey]
}

const saveOptionSynopsis = (prop, value) => {
  synopsis.options[prop] = value
}

const savePublisherOption = (publisherKey, prop, value) => {
  synopsis.publishers[publisherKey].options[prop] = value
}

module.exports = {
  backupKeys,
  recoverKeys,
  quit,
  addVisit,
  pageDataChanged,
  init,
  initialize,
  setPaymentInfo,
  updatePublisherInfo,
  networkConnected,
  verifiedP,
  boot,
  onBootStateFile,
  balanceReceived,
  onWalletProperties,
  paymentPresent,
  addFoundClosed,
  onWalletRecovery,
  onBraveryProperties,
  onLedgerFirstSync,
  onCallback,
  deleteSynopsis,
  saveOptionSynopsis,
  savePublisherOption,
  onTimeUntilReconcile,
  run,
  onNetworkConnected,
  migration
}
