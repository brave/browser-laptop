/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const acorn = require('acorn')
const format = require('date-fns/format')
const Immutable = require('immutable')
const electron = require('electron')
const ipc = electron.ipcMain
const session = electron.session
const path = require('path')
const os = require('os')
const qr = require('qr-image')
const underscore = require('underscore')
const tldjs = require('tldjs')
const urlFormat = require('url').format
const levelUp = require('level')
const random = require('random-lib')
const uuid = require('uuid')
const BigNumber = require('bignumber.js')

// Actions
const appActions = require('../../../js/actions/appActions')

// State
const aboutPreferencesState = require('../../common/state/aboutPreferencesState')
const ledgerState = require('../../common/state/ledgerState')
const pageDataState = require('../../common/state/pageDataState')
const updateState = require('../../common/state/updateState')

// Constants
const settings = require('../../../js/constants/settings')
const messages = require('../../../js/constants/messages')
const appConfig = require('../../../js/constants/appConfig')
const ledgerStatuses = require('../../common/constants/ledgerStatuses')

// Utils
const config = require('../../../js/constants/buildConfig')
const tabs = require('../../browser/tabs')
const locale = require('../../locale')
const getSetting = require('../../../js/settings').getSetting
const {getSourceAboutUrl, isSourceAboutUrl} = require('../../../js/lib/appUrlUtil')
const urlParse = require('../../common/urlParse')
const ruleSolver = require('../../extensions/brave/content/scripts/pageInformation')
const request = require('../../../js/lib/request')
const ledgerUtil = require('../../common/lib/ledgerUtil')
const tabState = require('../../common/state/tabState')
const pageDataUtil = require('../../common/lib/pageDataUtil')
const ledgerNotifications = require('./ledgerNotifications')
const ledgerVideoCache = require('../../common/cache/ledgerVideoCache')
const updater = require('../../updater')
const promoCodeFirstRunStorage = require('../../promoCodeFirstRunStorage')
const appUrlUtil = require('../../../js/lib/appUrlUtil')
const urlutil = require('../../../js/lib/urlutil')
const windowState = require('../../common/state/windowState')
const {makeImmutable, makeJS, isList, isImmutable} = require('../../common/state/immutableUtil')
const siteHacks = require('../../siteHacks')
const UrlUtil = require('../../../js/lib/urlutil')
const promotionStatuses = require('../../common/constants/promotionStatuses')

// Caching
let locationDefault = 'NOOP'
let currentUrl = locationDefault
let currentTimestamp = new Date().getTime()
let visitsByPublisher = {}
let bootP
let quitP
const _internal = {
  verboseP: process.env.LEDGER_VERBOSE || false,
  debugP: process.env.LEDGER_DEBUG || false,
  ruleset: {
    raw: [],
    cooked: []
  }
}
let userAgent = ''

// Libraries
let ledgerPublisher
let ledgerClient
let ledgerBalance
let client
let synopsis

// Timers
let balanceTimeoutId = false
let runTimeoutId
let promotionTimeoutId
let togglePromotionTimeoutId
let verifiedTimeoutId = false

// Database
let v2RulesetDB
const v2RulesetPath = 'ledger-rulesV2.leveldb'
const statePath = 'ledger-state.json'

// Definitions
const clientOptions = {
  debugP: process.env.LEDGER_DEBUG,
  loggingP: process.env.LEDGER_LOGGING,
  rulesTestP: process.env.LEDGER_RULES_TESTING,
  verboseP: process.env.LEDGER_VERBOSE,
  server: process.env.LEDGER_SERVER_URL,
  createWorker: electron.app.createWorker,
  version: 'v2',
  environment: process.env.LEDGER_ENVIRONMENT || 'production'
}

const platforms = {
  'darwin': 'osx',
  'win32x64': 'winx64',
  'win32ia32': 'winia32',
  'linux': 'linux'
}

let platform = platforms[process.platform]

if (process.platform === 'win32') {
  platform = platforms[process.platform + process.arch]
}

let referralServer = 'https://laptop-updates-staging.herokuapp.com'
let referralAPI = 'key'

if (clientOptions.environment === 'production') {
  referralServer = 'https://laptop-updates.brave.com'
  referralAPI = config.referralAPI || process.env.LEDGER_REFERRAL_API_KEY || ''
}

const fileTypes = {
  bmp: Buffer.from([0x42, 0x4d]),
  gif: Buffer.from([0x47, 0x49, 0x46, 0x38, [0x37, 0x39], 0x61]),
  ico: Buffer.from([0x00, 0x00, 0x01, 0x00]),
  jpeg: Buffer.from([0xff, 0xd8, 0xff]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
}
const minimumVisitTimeDefault = 8 * 1000
let signatureMax = 0
underscore.keys(fileTypes).forEach((fileType) => {
  if (signatureMax < fileTypes[fileType].length) signatureMax = fileTypes[fileType].length
})
signatureMax = Math.ceil(signatureMax * 1.5)

if (ipc) {
  ipc.on(messages.LEDGER_PUBLISHER, (event, location) => {
    if (!synopsis || event.sender.session === electron.session.fromPartition('default') || !tldjs.isValid(tldjs.getDomain(location))) {
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
}

let ledgerPaymentsPresent = {}
const paymentPresent = (state, tabId, present) => {
  if (present) {
    ledgerPaymentsPresent[tabId] = present
  } else {
    delete ledgerPaymentsPresent[tabId]
  }

  if (getSetting(settings.PAYMENTS_ENABLED) && present) {
    if (!balanceTimeoutId) {
      module.exports.getBalance(state)
    }

    appActions.onPromotionGet()

    state = checkSeed(state)
    getPublisherTimestamp(true)
  } else if (balanceTimeoutId) {
    clearTimeout(balanceTimeoutId)
    balanceTimeoutId = false
  }

  if (!present) {
    const status = ledgerState.getPromotionProp(state, 'promotionStatus')
    if (
      status === promotionStatuses.CAPTCHA_CHECK ||
      status === promotionStatuses.CAPTCHA_ERROR ||
      status === promotionStatuses.CAPTCHA_BLOCK
    ) {
      state = ledgerState.setPromotionProp(state, 'promotionStatus', null)
    }
  }

  return state
}

const checkSeed = (state) => {
  const seed = ledgerState.getInfoProp(state, 'passphrase')
  let localClient = client

  if (!localClient) {
    localClient = require('bat-client')
  }

  if (seed && localClient && !localClient.isValidPassPhrase(seed)) {
    state = ledgerState.setAboutProp(state, 'status', ledgerStatuses.CORRUPTED_SEED)
  }

  return state
}

const getPublisherTimestamp = (updateList) => {
  if (!client) {
    return
  }

  client.publisherTimestamp((err, result) => {
    if (err) {
      console.error('Error while retrieving publisher timestamp', err.toString())
      return
    }
    appActions.onPublisherTimestamp(result.timestamp, updateList)
  })
}

const addFoundClosed = (state) => {
  if (balanceTimeoutId) {
    clearTimeout(balanceTimeoutId)
  }
  const balanceFn = module.exports.getBalance.bind(null, state)
  balanceTimeoutId = setTimeout(balanceFn, 5 * ledgerUtil.milliseconds.second)
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
    client = ledgerClient(null, underscore.extend({roundtrip: module.exports.roundtrip}, clientOptions), null)

    getPublisherTimestamp()
  } catch (ex) {
    state = ledgerState.resetInfo(state)
    bootP = false
    console.error('ledger client boot error: ', ex)
    return state
  }

  if (client.sync(callback) === true) {
    run(state, random.randomInt({min: ledgerUtil.milliseconds.minute, max: 5 * ledgerUtil.milliseconds.minute}))
  }

  module.exports.getBalance(state)

  bootP = false

  return state
}

const promptForRecoveryKeyFile = () => {
  const defaultRecoveryKeyFilePath = path.join(electron.app.getPath('downloads'), '/brave_wallet_recovery.txt')
  if (process.env.SPECTRON) {
    // skip the dialog for tests
    console.log(`for test, trying to recover keys from path: ${defaultRecoveryKeyFilePath}`)
    return defaultRecoveryKeyFilePath
  } else {
    const dialog = electron.dialog
    const BrowserWindow = electron.BrowserWindow
    dialog.showDialog(BrowserWindow.getFocusedWindow(), {
      type: 'select-open-file',
      defaultPath: defaultRecoveryKeyFilePath,
      extensions: [['txt']],
      includeAllFiles: false
    }, (files) => {
      appActions.onFileRecoveryKeys((files && files.length ? files[0] : null))
    })
  }
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
  let recoveryKey = null
  const fs = require('fs')
  let data = fs.readFileSync(filePath)

  if (!data || !data.length || !(data.toString())) {
    state = logError(state, 'No data in backup file', 'recoveryWallet')
  } else {
    try {
      const recoveryFileContents = data.toString()

      let messageLines = recoveryFileContents.match(/^.+$/gm)

      let passphraseLine = '' || messageLines[2]

      const passphrasePattern = new RegExp([locale.translation('ledgerBackupText4'), '(.+)$'].join(' '))
      recoveryKey = (passphraseLine.match(passphrasePattern) || [])[1]
    } catch (exc) {
      state = logError(state, exc, 'recoveryWallet')
    }
  }

  return {
    state,
    recoveryKey
  }
}

const getPublisherData = (result, scorekeeper) => {
  let duration = result.duration

  let data = {
    verified: result.options.verified || false,
    exclude: result.options.exclude || false,
    publisherKey: result.publisherKey,
    providerName: result.providerName,
    siteName: result.publisherKey,
    views: result.visits,
    duration: duration,
    daysSpent: 0,
    hoursSpent: 0,
    minutesSpent: 0,
    secondsSpent: 0,
    faviconURL: result.faviconURL,
    score: result.scores ? result.scores[scorekeeper] : 0,
    pinPercentage: result.pinPercentage,
    weight: result.pinPercentage
  }

  data.publisherURL = result.publisherURL || ((result.protocol || 'https:') + '//' + result.publisherKey)

  // media publisher
  if (result.faviconName) {
    data.siteName = locale.translation('publisherMediaName', {
      publisherName: result.faviconName,
      provider: result.providerName
    })
  }

  if (duration >= ledgerUtil.milliseconds.day) {
    data.daysSpent = Math.max(Math.round(duration / ledgerUtil.milliseconds.day), 1)
  } else if (duration >= ledgerUtil.milliseconds.hour) {
    data.hoursSpent = Math.max(Math.floor(duration / ledgerUtil.milliseconds.hour), 1)
    data.minutesSpent = Math.round((duration % ledgerUtil.milliseconds.hour) / ledgerUtil.milliseconds.minute)
  } else if (duration >= ledgerUtil.milliseconds.minute) {
    data.minutesSpent = Math.max(Math.floor(duration / ledgerUtil.milliseconds.minute), 1)
    data.secondsSpent = Math.round((duration % ledgerUtil.milliseconds.minute) / ledgerUtil.milliseconds.second)
  } else {
    data.secondsSpent = Math.max(Math.round(duration / ledgerUtil.milliseconds.second), 1)
  }

  if (_internal.verboseP) {
    console.log('\ngetPublisherData result=' + JSON.stringify(result, null, 2) + '\ndata=' + JSON.stringify(data, null, 2))
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

// Removes entries older entries and entries that have 0 visits across windows
const pruneSynopsis = (state) => {
  if (!synopsis) {
    return state
  }

  const json = synopsis.toJSON()
  if (!json || !json.publishers) {
    return state
  }

  appActions.onPruneSynopsis(json.publishers)

  return ledgerState.saveSynopsis(state, json.publishers)
}

// TODO we should convert this function and all related ones into immutable
// TODO merge publishers and publisherData that is created in getPublisherData
// so that we don't need to create new Map every single time
const synopsisNormalizer = (state, changedPublisher, returnState = true, prune = false) => {
  let dataPinned = [] // change to list
  let dataUnPinned = [] // change to list
  let dataExcluded = [] // change to list
  const scorekeeper = ledgerState.getSynopsisOption(state, 'scorekeeper')

  if (prune) {
    state = module.exports.pruneSynopsis(state)
  }

  let publishers = ledgerState.getPublishers(state).toJS()
  let pinnedTotal = 0
  let unPinnedTotal = 0
  Object.keys(publishers).forEach(publisherKey => {
    let publisher = publishers[publisherKey]

    if (!ledgerUtil.visibleP(state, publisherKey)) {
      return
    }

    publisher.publisherKey = publisherKey

    if (publisher.pinPercentage && publisher.pinPercentage > 0) {
      // pinned
      pinnedTotal += publisher.pinPercentage
      dataPinned.push(getPublisherData(publisher, scorekeeper))
    } else if (ledgerUtil.stickyP(state, publisher.publisherKey)) {
      // unpinned
      unPinnedTotal += publisher.scores ? publisher.scores[scorekeeper] : 0
      dataUnPinned.push(publisher)
    } else {
      // excluded
      let newPublisher = getPublisherData(publisher, scorekeeper)
      newPublisher.percentage = 0
      newPublisher.weight = 0
      dataExcluded.push(newPublisher)
    }
  })

  if (
    dataPinned.length === 0 &&
    dataUnPinned.length === 0 &&
    dataExcluded.length === 0
  ) {
    if (returnState) {
      return ledgerState.saveAboutSynopsis(state, Immutable.List())
    }

    return []
  }

  // round if over 100% of pinned publishers
  if (pinnedTotal > 100) {
    if (changedPublisher) {
      let changedObject = dataPinned.find(publisher => publisher.publisherKey === changedPublisher)
      if (changedObject) {
        const setOne = changedObject.pinPercentage > (100 - dataPinned.length - 1)

        if (setOne) {
          changedObject.pinPercentage = 100 - dataPinned.length + 1
          changedObject.weight = changedObject.pinPercentage
        }

        const pinnedRestTotal = pinnedTotal - changedObject.pinPercentage
        dataPinned = dataPinned.filter(publisher => publisher.publisherKey !== changedPublisher)
        dataPinned = module.exports.normalizePinned(dataPinned, pinnedRestTotal, (100 - changedObject.pinPercentage), setOne)
        dataPinned = module.exports.roundToTarget(dataPinned, (100 - changedObject.pinPercentage), 'pinPercentage')

        dataPinned.push(changedObject)
      }
    } else {
      dataPinned = module.exports.normalizePinned(dataPinned, pinnedTotal, 100)
      dataPinned = module.exports.roundToTarget(dataPinned, 100, 'pinPercentage')
    }

    dataUnPinned = dataUnPinned.map((result) => {
      let publisher = getPublisherData(result, scorekeeper)
      publisher.percentage = 0
      publisher.weight = 0
      return publisher
    })
  } else if (dataUnPinned.length === 0 && pinnedTotal < 100) {
    // when you don't have any unpinned sites and pinned total is less then 100 %
    let changedObject = dataPinned.find(publisher => publisher.publisherKey === changedPublisher)
    if (changedObject) {
      const pinnedRestTotal = pinnedTotal - changedObject.pinPercentage
      const restPercentage = 100 - changedObject.pinPercentage
      dataPinned = dataPinned.filter(publisher => publisher.publisherKey !== changedPublisher)
      dataPinned = module.exports.normalizePinned(dataPinned, pinnedRestTotal, restPercentage)
      dataPinned = module.exports.roundToTarget(dataPinned, restPercentage, 'pinPercentage')
      dataPinned.push(changedObject)
    } else {
      dataPinned = module.exports.normalizePinned(dataPinned, pinnedTotal, 100, false)
      dataPinned = module.exports.roundToTarget(dataPinned, 100, 'pinPercentage')
    }
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
    dataUnPinned = module.exports.roundToTarget(dataUnPinned, (100 - pinnedTotal), 'percentage')
  }

  const newData = dataPinned.concat(dataUnPinned, dataExcluded)

  // sync synopsis
  newData.forEach((item) => {
    const publisherKey = item.publisherKey
    const weight = item.weight
    const pinPercentage = item.pinPercentage
    savePublisherData(publisherKey, 'weight', weight)
    savePublisherData(publisherKey, 'pinPercentage', pinPercentage)
    state = ledgerState.setPublishersProp(state, publisherKey, 'weight', weight)
    state = ledgerState.setPublishersProp(state, publisherKey, 'pinPercentage', pinPercentage)
  })

  if (returnState) {
    return ledgerState.saveAboutSynopsis(state, newData)
  }

  return newData
}

const updatePublisherInfo = (state, changedPublisher, refresh = false) => {
  if (!refresh && !getSetting(settings.PAYMENTS_ENABLED)) {
    return state
  }

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
const verifiedP = (state, publisherKey, callback, lastUpdate) => {
  const clientCallback = (err, result) => {
    if (err) {
      console.error(`Error verifying publisher ${publisherKey}: `, err.toString())
      return
    }

    if (callback) {
      if (result) {
        callback(null, result, lastUpdate)
      } else {
        callback(err, {})
      }
    }
  }

  if (Array.isArray(publisherKey)) {
    client.publishersInfo(publisherKey, clientCallback)
  } else {
    client.publisherInfo(publisherKey, clientCallback)
  }

  if (process.env.NODE_ENV === 'test') {
    ['brianbondy.com', 'clifton.io'].forEach((key) => {
      if (ledgerState.hasPublisher(state, key)) {
        state = ledgerState.setPublisherOption(state, key, 'verified', true)
        savePublisherOption(publisherKey, 'verified', true)
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
    return setTimeout(() => excludeP(publisherKey, callback), 5 * ledgerUtil.milliseconds.second)
  }

  inspectP(v2RulesetDB, v2RulesetPath, publisherKey, 'exclude', 'domain:' + publisherKey, (err, result) => {
    if (!err) {
      return done(err, result)
    }

    let props = ledgerPublisher.getPublisherProps(publisherKey)
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

const addSiteVisit = (state, timestamp, location, tabId, manualAdd = false) => {
  if (!synopsis || location == null) {
    return state
  }

  const protocol = urlParse(location).protocol
  location = pageDataUtil.getInfoKey(location)

  const minimumVisitTime = getSetting(settings.PAYMENTS_MINIMUM_VISIT_TIME)
  const duration = manualAdd ? parseInt(minimumVisitTime) : new Date().getTime() - timestamp
  const locationData = manualAdd ? Immutable.fromJS({ publisher: tldjs.getDomain(location) }) : ledgerState.getLocation(state, location)

  if (_internal.verboseP) {
    console.log(
      `locations[${location}]=${JSON.stringify(locationData, null, 2)} ` +
      `duration=${(duration)} msec tabId= ${tabId}`
    )
  }

  if (locationData.isEmpty()) {
    return state
  }

  let publisherKey = locationData.get('publisher')
  let revisitP = false

  if (duration >= minimumVisitTime) {
    if (!visitsByPublisher[publisherKey]) {
      visitsByPublisher[publisherKey] = {}
    }

    if (!visitsByPublisher[publisherKey][location]) {
      visitsByPublisher[publisherKey][location] = {
        tabIds: []
      }
    }

    revisitP = manualAdd ? false : visitsByPublisher[publisherKey][location].tabIds.indexOf(tabId) !== -1
    if (!revisitP) {
      visitsByPublisher[publisherKey][location].tabIds.push(tabId)
    }
  }

  return module.exports.saveVisit(state, publisherKey, {
    duration,
    protocol: protocol,
    revisited: revisitP
  })
}

const saveVisit = (state, publisherKey, options) => {
  if (!synopsis || !publisherKey || !options) {
    return state
  }

  if (_internal.verboseP) {
    console.log('\nadd publisher ' + publisherKey + ': ' + (options.duration / 1000) + ' sec' + ' revisitP=' + options.revisited)
  }

  synopsis.addPublisher(publisherKey, {
    duration: options.duration,
    revisitP: options.revisited,
    ignoreMinTime: options.ignoreMinTime || false
  })

  state = ledgerState.setPublisher(state, publisherKey, synopsis.publishers[publisherKey])
  if (options.protocol) {
    state = ledgerState.setPublishersProp(state, publisherKey, 'protocol', options.protocol)
  }
  state = updatePublisherInfo(state)
  state = module.exports.checkVerifiedStatus(state, publisherKey)

  return state
}

const onVerifiedPStatus = (error, result, lastUpdate) => {
  if (error || result == null) {
    return
  }

  if (!Array.isArray(result)) {
    result = [result]
  }

  if (result.length === 0) {
    return
  }

  const data = result.reduce((publishers, item) => {
    if (item.err) {
      return publishers
    }

    const publisherKey = item.publisher
    let verified = false
    if (item && item.properties) {
      verified = !!item.properties.verified
      savePublisherOption(publisherKey, 'verified', verified)
    }

    savePublisherOption(publisherKey, 'verifiedTimestamp', lastUpdate)

    publishers.push({
      publisherKey,
      verified,
      verifiedTimestamp: lastUpdate
    })

    return publishers
  }, [])

  if (data && data.length > 0) {
    appActions.onPublishersOptionUpdate(data)
  }
}

const checkVerifiedStatus = (state, publisherKeys, publisherTimestamp) => {
  if (publisherKeys == null) {
    return state
  }

  if (!Array.isArray(publisherKeys)) {
    publisherKeys = [publisherKeys]
  }

  const lastUpdate = parseInt(publisherTimestamp || ledgerState.getLedgerValue(state, 'publisherTimestamp'))
  const checkKeys = publisherKeys.reduce((init, key) => {
    const lastPublisherUpdate = parseInt(ledgerState.getPublisherOption(state, key, 'verifiedTimestamp') || 0)

    if (lastUpdate > lastPublisherUpdate) {
      init.push(key)
    }

    return init
  }, [])

  if (checkKeys.length === 0) {
    return state
  }

  state = module.exports.verifiedP(state, checkKeys, onVerifiedPStatus, lastUpdate)

  return state
}

const shouldTrackTab = (state, tabId) => {
  let tabFromState = tabState.getByTabId(state, tabId)
  if (tabFromState == null) {
    tabFromState = pageDataState.getLastClosedTab(state, tabId)
  }
  const partition = tabFromState.get('partition', '')
  const ses = session.fromPartition(partition)
  const isPrivate = (ses && ses.isOffTheRecord()) || tabFromState.get('incognito') || partition === appConfig.tor.partition
  return !isPrivate && !tabFromState.isEmpty() && ledgerUtil.shouldTrackView(tabFromState)
}

const addNewLocation = (state, location, tabId = tabState.TAB_ID_NONE, keepInfo = false, manualAdd = false) => {
  // We always want to have the latest active tabId
  const currentTabId = manualAdd ? tabId : pageDataState.getLastActiveTabId(state)
  state = pageDataState.setLastActiveTabId(state, tabId)
  if (location === currentUrl && !manualAdd) {
    return state
  }

  // Save previous recorder page
  if (currentUrl !== locationDefault && currentTabId != null && currentTabId !== tabState.TAB_ID_NONE && !manualAdd) {
    if (module.exports.shouldTrackTab(state, currentTabId)) {
      state = module.exports.addSiteVisit(state, currentTimestamp, currentUrl, currentTabId)
    }
  }

  if (manualAdd) {
    const minimumVisits = getSetting(settings.PAYMENTS_MINIMUM_VISITS)
    for (let v = 0; v < minimumVisits; v++) {
      state = module.exports.addSiteVisit(state, currentTimestamp, location, currentTabId, manualAdd)
    }
    return state
  }

  if (location === locationDefault && !keepInfo) {
    state = pageDataState.resetInfo(state)
  }

  // Update to the latest view
  currentUrl = location
  currentTimestamp = new Date().getTime()
  return state
}

const onFavIconReceived = (state, publisherKey, blob) => {
  if (publisherKey == null) {
    return state
  }

  state = ledgerState.setPublishersProp(state, publisherKey, 'faviconURL', blob)
  module.exports.savePublisherData(publisherKey, 'faviconURL', blob)

  return state
}

const getFavIcon = (state, publisherKey, page) => {
  let publisher = ledgerState.getPublisher(state, publisherKey)
  const protocol = page.get('protocol')
  if (protocol && !publisher.get('protocol')) {
    publisher = publisher.set('protocol', protocol)
    state = ledgerState.setPublishersProp(state, publisherKey, 'protocol', protocol)
  }

  if (publisher.get('faviconURL') == null && (page.get('faviconURL') || publisher.get('protocol'))) {
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

      prefix = Buffer.from(blob.substr(tail + 8, signatureMax), 'base64')
      underscore.keys(fileTypes).forEach((fileType) => {
        if (matchP) return
        if (
          prefix.length < fileTypes[fileType].length ||
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

const pageDataChanged = (state, viewData = {}, keepInfo = false) => {
  if (!getSetting(settings.PAYMENTS_ENABLED)) {
    return state
  }

  let info = pageDataState.getLastInfo(state)
  const tabId = viewData.tabId || pageDataState.getLastActiveTabId(state)
  let location = viewData.location || locationDefault

  if (!synopsis) {
    state = addNewLocation(state, locationDefault, tabId)
    return state
  }

  if (UrlUtil.isUrlPDF(location)) {
    location = UrlUtil.getLocationIfPDF(location)
    info = Immutable.fromJS({
      key: location,
      location: location
    })
  }

  const realUrl = getSourceAboutUrl(location) || location
  if (
    info.isEmpty() &&
    !isSourceAboutUrl(realUrl) &&
    viewData &&
    viewData.tabId != null &&
    viewData.location != null
  ) {
    // we need to add visit even when you switch from about page to a normal site
    state = addNewLocation(state, location, tabId)
    return state
  } else if (info.isEmpty() || isSourceAboutUrl(realUrl)) {
    // we need to log empty visit
    state = addNewLocation(state, locationDefault, tabId, keepInfo)
    return state
  }

  let locationKey = info.get('key')
  const locationData = ledgerState.getLocation(state, locationKey)
  let publisherKey = locationData.get('publisher')
  let publisher = ledgerState.getPublisher(state, publisherKey)
  if (!publisher.isEmpty()) {
    if (publisher.get('faviconURL') == null) {
      state = getFavIcon(state, publisherKey, info)
    }
  } else {
    const infoPublisher = info.get('publisher')
    if (infoPublisher != null) {
      publisherKey = infoPublisher
    } else {
      try {
        // TODO this is only filled when you have ledger on, which means that this whole pageDataChanged
        // can be ignored if ledger is disabled?
        publisherKey = ledgerPublisher.getPublisher(locationKey, _internal.ruleset.raw)
      } catch (ex) {
        console.error('getPublisher error for ' + locationKey + ': ' + ex.toString())
      }
    }

    if (!publisherKey || (ledgerUtil.blockedP(state, publisherKey))) {
      publisherKey = null
    }

    if (publisherKey) {
      publisher = ledgerState.getPublisher(state, publisherKey)
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
      if (!getSetting(settings.PAYMENTS_SITES_AUTO_SUGGEST)) {
        appActions.onPublisherOptionUpdate(publisherKey, 'exclude', true)
        savePublisherOption(publisherKey, 'exclude', true)
      } else {
        excludeP(publisherKey, (unused, exclude) => {
          appActions.onPublisherOptionUpdate(publisherKey, 'exclude', exclude)
          savePublisherOption(publisherKey, 'exclude', exclude)
        })
      }
    }

    state = getFavIcon(state, publisherKey, info)
  }

  state = addNewLocation(state, location, tabId, keepInfo)

  return state
}

const backupKeys = (state, backupAction) => {
  const date = format(new Date(), 'MM/DD/YYYY')
  const passphrase = ledgerState.getInfoProp(state, 'passphrase')

  const messageLines = [
    locale.translation('ledgerBackupText1'),
    [locale.translation('ledgerBackupText2'), date].join(' '),
    '',
    [locale.translation('ledgerBackupText4'), passphrase].join(' '),
    '',
    locale.translation('ledgerBackupText5')
  ]

  const message = messageLines.join(os.EOL)
  const defaultFilePath = path.join(electron.app.getPath('downloads'), '/brave_wallet_recovery.txt')

  const fs = require('fs')

  if (backupAction === 'print') {
    tabs.create({url: appUrlUtil.aboutUrls.get('about:printkeys')})

    // we do not check whether the user actually printed the backup word list
    return aboutPreferencesState.setBackupStatus(state, true)
  }

  const dialog = electron.dialog
  const BrowserWindow = electron.BrowserWindow

  dialog.showDialog(BrowserWindow.getFocusedWindow(), {
    type: 'select-saveas-file',
    defaultPath: defaultFilePath,
    extensions: [['txt']],
    includeAllFiles: false
  }, (files) => {
    const file = files && files.length ? files[0] : null
    if (file) {
      try {
        fs.writeFileSync(file, message)
        appActions.onLedgerBackupSuccess()
      } catch (e) {
        console.error('Problem saving backup keys')
      }
    }
  })
  return state
}

const fileRecoveryKeys = (state, recoveryKeyFile) => {
  if (!recoveryKeyFile) {
    // user canceled from dialog, we abort without error
    return state
  }

  state = aboutPreferencesState.setRecoveryInProgress(state, true)
  const result = loadKeysFromBackupFile(state, recoveryKeyFile)
  const recoveryKey = result.recoveryKey || ''
  state = result.state

  return recoverKeys(state, false, recoveryKey)
}

const recoverKeys = (state, useRecoveryKeyFile, key) => {
  let recoveryKey

  if (useRecoveryKeyFile) {
    promptForRecoveryKeyFile()
    return state
  }

  if (!recoveryKey) {
    recoveryKey = key
  }

  if (typeof recoveryKey !== 'string') {
    // calling logError sets the error object
    state = logError(state, true, 'recoverKeys')
    state = aboutPreferencesState.setRecoveryStatus(state, false)
    return state
  }

  state = aboutPreferencesState.setRecoveryBalanceRecalculated(state, false)
  client.recoverWallet(null, recoveryKey, (err, result) => {
    appActions.onWalletRecovery(err, result)
    appActions.onPromotionRemoval()
    appActions.onPromotionGet()
  })

  return state
}

const onWalletRecovery = (state, error, result) => {
  if (error) {
    // we reset ledgerInfo.error to what it was before (likely null)
    // if ledgerInfo.error is not null, the wallet info will not display in UI
    // logError sets ledgerInfo.error, so we must we clear it or UI will show an error
    state = logError(state, error.toString(), 'recoveryWallet')
    state = aboutPreferencesState.setRecoveryStatus(state, false)
  } else {
    // convert buffer to Uint8Array
    let seed = result && result.getIn(['properties', 'wallet', 'keyinfo', 'seed'])
    if (seed) {
      result = result.setIn(['properties', 'wallet', 'keyinfo', 'seed'], uintKeySeed(seed))
    }

    // remove old QR codes and addresses
    state = ledgerState.setInfoProp(state, 'walletQR', Immutable.Map())
    state = ledgerState.setInfoProp(state, 'addresses', Immutable.Map())

    const status = ledgerState.getAboutProp(state, 'status')

    if (status === ledgerStatuses.CORRUPTED_SEED) {
      state = ledgerState.setAboutProp(state, 'status', '')
    }

    callback(error, result)

    if (balanceTimeoutId) {
      clearTimeout(balanceTimeoutId)
    }
    module.exports.getBalance(state)
    state = aboutPreferencesState.setRecoveryStatus(state, true)
  }

  return state
}

const resetPublishers = (state) => {
  state = ledgerState.resetPublishers(state)
  synopsis.publishers = {}

  return state
}

const quit = (state) => {
  quitP = true
  state = addNewLocation(state, locationDefault)

  if (!getSetting(settings.PAYMENTS_ENABLED) && getSetting(settings.SHUTDOWN_CLEAR_PUBLISHERS)) {
    resetPublishers(state)
  }

  return state
}

const initSynopsis = (state) => {
  state = ledgerState.saveSynopsis(state, null, synopsis.options)
  let value = getSetting(settings.PAYMENTS_MINIMUM_VISIT_TIME)
  if (!value) {
    value = minimumVisitTimeDefault
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
    const publisher = item[1] || Immutable.Map()

    if (!publisher.getIn(['options', 'exclude'])) {
      excludeP(publisherKey, (unused, exclude) => {
        appActions.onPublisherOptionUpdate(publisherKey, 'exclude', exclude)
        savePublisherOption(publisherKey, 'exclude', exclude)
      })
    }
  }

  state = updatePublisherInfo(state)

  return state
}

const checkPromotions = () => {
  if (promotionTimeoutId) {
    clearInterval(promotionTimeoutId)
  }

  // get promotions
  appActions.onPromotionGet()

  promotionTimeoutId = setTimeout(() => {
    checkPromotions()
  }, random.randomInt({min: 20 * ledgerUtil.milliseconds.hour, max: 24 * ledgerUtil.milliseconds.hour}))
}

const enable = (state, paymentsEnabled) => {
  if (paymentsEnabled) {
    if (!getSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED)) {
      appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED, true)
    }
  }

  if (paymentsEnabled === getSetting(settings.PAYMENTS_ENABLED)) {
    // on start
    if (togglePromotionTimeoutId) {
      clearTimeout(togglePromotionTimeoutId)
    }

    togglePromotionTimeoutId = setTimeout(() => {
      checkPromotions()
    }, random.randomInt({min: 10 * ledgerUtil.milliseconds.second, max: 15 * ledgerUtil.milliseconds.second}))
  } else if (paymentsEnabled) {
    // toggle on
    if (togglePromotionTimeoutId) {
      clearTimeout(togglePromotionTimeoutId)
    }

    const promotion = ledgerState.getPromotionNotification(state)
    if (!promotion.isEmpty()) {
      appActions.hideNotification(promotion.get('message'))
    }

    state = ledgerState.setActivePromotion(state, paymentsEnabled)
    getPromotion(state)
  } else {
    // toggle off
    state = ledgerState.setPromotionProp(state, 'promotionStatus', null)
  }

  if (synopsis) {
    return updatePublisherInfo(state, null, true)
  }

  if (!ledgerPublisher) {
    ledgerPublisher = require('bat-publisher')
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

  if (!ledgerState.getPublishers(state).isEmpty()) {
    state = synopsisNormalizer(state)
  }

  return state
}

const pathName = (name) => {
  if (!name) {
    return null
  }

  const parts = path.parse(name)
  return path.join(electron.app.getPath('userData'), parts.dir, `${parts.name}${parts.ext}`)
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
      const ctx = ledgerPublisher.getPublisherProps(publisherKey)

      if (!ctx.TLD) continue

      if (publisher.publisherURL) ctx.URL = publisher.publisherURL
      if (!ctx.URL) ctx.URL = (publisher.get('protocol') || 'https:') + '//' + publisherKey

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
  const balanceServer = process.env.BALANCE_SERVER_URL

  if ((!ledgerBalance) && (balanceServer)) {
    ledgerBalance = require('bat-balance')
    ledgerBalance.providers.forEach((entry) => { entry.site = entry.server = balanceServer })
  }

  if (!ledgerClient) ledgerClient = require('bat-client')
  _internal.debugP = ledgerClient.prototype.boolion(process.env.LEDGER_PUBLISHER_DEBUG)
  _internal.verboseP = ledgerClient.prototype.boolion(process.env.LEDGER_PUBLISHER_VERBOSE)
}

/**
 * This callback that we do it in roundtrips
 *
 * @callback roundtripCallback
 * @param {Error|null} error - error when doing a request, null if no errors
 * @param {object} response - response object that we get from request.request
 * @param {any} payload - data that we get from the request
 */

/**
 * Round trip for fetching data (scrap data from html) inside window process
 * @param {object} params - contains params from roundtrip
 * @param {string} params.url - url of the site that we want to scrap
 * @param {string} params.verboseP - tells us if we want to log the process or not
 * @param {roundtripCallback} callback - The callback that handles the response
 */
const roundTripFromWindow = (params, callback) => {
  if (!callback) {
    return
  }

  if (!params || !params.url) {
    if (params && params.verboseP) {
      console.log(`We are missing url. Params ${JSON.stringify(params)}`)
    }

    callback(new Error('Url is missing'))
    return
  }

  request.fetchPublisherInfo(params.url, {
    method: 'GET',
    responseType: 'text',
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  }, (error, body) => {
    if (error) {
      if (params.verboseP) {
        console.log(`roundTripFromWindow error: ${error.toString()}`)
      }
      return callback(error)
    }

    if (params.verboseP) {
      console.log(`roundTripFromWindow success: ${JSON.stringify(body)}`)
    }

    return callback(null, null, body)
  })
}

/**
 * Round trip function for executing actions
 * from the bat libraries (mostly server calls)
 * @param {object} params - params that are directly tied to request.request
 * @param {string} params.server - server url
 * @param {string} params.method - HTTP method (GET, PUT, etc)
 * @param {object} params.payload - payload that we want to send to the server
 * @param {object} params.headers - HTTP headers
 * @param {string} params.path - relative path to requested url
 * @param {boolean} params.binaryP - are we receiving raw payload back
 * @param {object} options
 * @param {boolean} options.verboseP - tells us if we want to log the process or not
 * @param {object} options.headers - headers that are used in the request.request
 * @param {string} options.server - server url
 * @param {boolean} options.binaryP - are we receiving binary payload back
 * @param {boolean} options.rawP - are we receiving raw payload back
 * @param {boolean} options.scrapeP - are we doping scraping
 * @param {boolean} options.windowP - do we want to run this request in the window process
 * @param {roundtripCallback} callback - The callback that handles the response
 */
const roundtrip = (params, options, callback) => {
  let parts = typeof params.server === 'string' ? urlParse(params.server)
    : typeof params.server !== 'undefined' ? params.server
      : typeof options.server === 'string' ? urlParse(options.server) : options.server
  const binaryP = options.binaryP || params.binaryP
  const rawP = binaryP || options.rawP || options.scrapeP

  if (!params.method) params.method = 'GET'
  parts = underscore.extend(underscore.pick(parts, ['protocol', 'hostname', 'port']),
    underscore.omit(params, ['headers', 'payload', 'timeout']))

// TBD: let the user configure this via preferences [MTR]
  if (params.useProxy) {
    if (parts.hostname === 'ledger.brave.com') {
      parts.hostname = 'ledger-proxy.privateinternetaccess.com'
    } else if (parts.hostname === 'ledger.mercury.basicattentiontoken.org') {
      parts.hostname = 'mercury-proxy.privateinternetaccess.com'
    }
  }

  const i = parts.path.indexOf('?')
  if (i !== -1) {
    parts.pathname = parts.path.substring(0, i)
    parts.search = parts.path.substring(i)
  } else {
    parts.pathname = parts.path
  }

  if (options.windowP) {
    roundTripFromWindow({url: urlFormat(parts), verboseP: options.verboseP}, callback)
    return
  }

  options = {
    url: urlFormat(parts),
    method: params.method,
    payload: params.payload,
    responseType: binaryP ? 'binary' : 'text',
    headers: underscore.defaults(params.headers || {}, {
      'content-type': 'application/json; charset=utf-8',
      'user-agent': userAgent
    }),
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
      console.log('>>> ' + (rawP ? '...' : (body || '').split('\n').join('\n>>> ')))
    }

    if (err) return callback(err, response)

    if (Math.floor(response.statusCode / 100) !== 2) {
      if (params.useProxy && response.statusCode === 403) {
        params.useProxy = false
        return module.exports.roundtrip(params, options, callback)
      }

      return callback(
        new Error('HTTP response ' + response.statusCode + ' for ' + params.method + ' ' + params.path),
        response)
    }

    try {
      payload = rawP ? body : (response.statusCode !== 204) ? JSON.parse(body) : null
    } catch (err) {
      return callback(err, response)
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

const observeTransactions = (state, transactions) => {
  if (!transactions) {
    return state
  }

  const current = ledgerState.getInfoProp(state, 'transactions')
  if (current && current.size === transactions.size) {
    return state
  }

  // Notify the user of new transactions.
  if (getSetting(settings.PAYMENTS_NOTIFICATIONS)) {
    if (transactions.size > 0) {
      const newestTransaction = transactions.first()
      if (newestTransaction && newestTransaction.get('contribution')) {
        state = ledgerState.setAboutProp(state, 'status', '')
        ledgerNotifications.showPaymentDone(newestTransaction.get('contribution', Immutable.Map()))
      }
    }
  }

  return state
}

// TODO convert this function and related ones to immutable
const getStateInfo = (state, parsedData) => {
  if (parsedData == null) {
    return state
  }

  const info = parsedData.paymentInfo

  if (!parsedData.properties || !parsedData.properties.wallet) {
    return state
  }

  if (!ledgerClient) {
    ledgerClient = require('bat-client')
  }

  if (parsedData.properties && parsedData.properties.wallet && parsedData.properties.wallet.keyinfo) {
    parsedData.properties.wallet.keyinfo.seed = uintKeySeed(parsedData.properties.wallet.keyinfo.seed)
  }

  const newInfo = {
    paymentId: parsedData.properties.wallet.paymentId,
    created: !!parsedData.properties.wallet,
    creating: !parsedData.properties.wallet,
    reconcileFrequency: parsedData.properties.days,
    reconcileStamp: parsedData.reconcileStamp
  }

  try {
    let passphrase = ledgerClient.prototype.getWalletPassphrase(parsedData)
    if (passphrase) {
      newInfo.passphrase = passphrase.join(' ')
    }
  } catch (e) {
    console.error(e)
    state = ledgerState.setAboutProp(state, 'status', ledgerStatuses.CORRUPTED_SEED)
  }

  state = ledgerState.mergeInfoProp(state, newInfo)

  if (info) {
    state = ledgerState.mergeInfoProp(state, info)
    state = module.exports.generatePaymentData(state)
  }

  let transactions = []
  if (!parsedData.transactions) {
    return state
  }

  const current = ledgerState.getInfoProp(state, 'transactions') || Immutable.List()
  if (current && current.size === parsedData.transactions.length) {
    return state
  }

  for (let i = parsedData.transactions.length - 1; i >= 0; i--) {
    let transaction = parsedData.transactions[i]

    if (!transaction.ballots) {
      continue
    }

    const ballotsTotal = Object.keys(transaction.ballots).reduce((acc, key) => {
      return acc + transaction.ballots[key]
    }, 0)

    if (ballotsTotal < transaction.votes) break

    transactions.push(underscore.pick(transaction, [
      'viewingId',
      'contribution',
      'submissionStamp',
      'votes',
      'count',
      'ballots'
    ]))
  }

  if (current && current.size === transactions.length) {
    return state
  }

  let newTransactions = Immutable.fromJS(transactions).map(transaction => {
    if (!transaction || transaction.has('names')) {
      return transaction
    }

    let names = Immutable.Map()
    const publisherKeys = transaction.get('ballots').keySeq() || Immutable.List()

    publisherKeys.forEach(publisherKey => {
      const publisher = ledgerState.getPublisher(state, publisherKey)

      if (!publisher.has('faviconName')) {
        return
      }

      names = names.set(publisherKey, locale.translation('publisherMediaName', {
        publisherName: publisher.get('faviconName'),
        provider: publisher.get('providerName')
      }))
    })

    return transaction.set('names', names)
  })

  state = observeTransactions(state, newTransactions)
  return ledgerState.setInfoProp(state, 'transactions', newTransactions)
}

const generatePaymentData = (state) => {
  const ledgerInfo = ledgerState.getInfoProps(state)
  const addresses = ledgerInfo.get('addresses') || Immutable.List()

  addresses.forEach((address, index) => {
    if (ledgerInfo.hasIn(['walletQR', index])) {
      return
    }

    let url = null
    switch (index) {
      case 'BAT':
      case 'ETH':
        url = `ethereum:${address}`
        break
      case 'BTC':
        url = `bitcoin:${address}`
        break
      case 'LTC':
        url = `litecoin:${address}`
        break
      default:
        return
    }

    try {
      let chunks = []
      qr.image(url, {type: 'png'})
        .on('data', (chunk) => {
          chunks.push(chunk)
        })
        .on('end', () => {
          const paymentIMG = 'data:image/png;base64,' + Buffer.concat(chunks).toString('base64')
          appActions.onLedgerQRGenerated(index, paymentIMG)
        })
    } catch (ex) {
      console.error('qr.imageSync (for url ' + url + ') error: ' + ex.toString())
    }
  })

  return state
}

const getPaymentInfo = (state) => {
  let amount, currency

  if (!client) {
    return state
  }

  try {
    const bravery = client.getBraveryProperties()
    state = ledgerState.setInfoProp(state, 'bravery', Immutable.fromJS(bravery))
    if (bravery.fee) {
      amount = bravery.fee.amount
      currency = bravery.fee.currency
    }

    client.getWalletProperties(amount, currency, function (err, body) {
      if (err) {
        if (err.message) {
          console.error('getWalletProperties error: ' + err.message)
        } else {
          console.error('getWalletProperties error: ' + err.toString())
        }
        appActions.onWalletPropertiesError()
        return
      }

      appActions.onWalletProperties(body)
    })
  } catch (ex) {
    console.error('properties error: ' + ex.toString())
  }

  return state
}

const lockInContributionAmount = (state, balance) => {
  // Lock in contribution amount if amount hasn't been chosen and balance is non-zero
  // (ex: they receive a grant or fund the wallet)
  // Amount is only set when user explicitly picks a contribution amount
  if (balance > 0) {
    const value = getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT, undefined, false)
    if (value === null) {
      const defaultFromConfig = ledgerState.getContributionAmount(state)
      appActions.changeSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT, defaultFromConfig)
    }
  }
}

const setNewTimeUntilReconcile = (newReconcileTime = null) => {
  client.setTimeUntilReconcile(newReconcileTime, (err, stateResult) => {
    if (err) return console.error('ledger setTimeUntilReconcile error: ' + err.toString())

    if (!stateResult) {
      return
    }

    appActions.onTimeUntilReconcile(stateResult)
  })
}

const onWalletProperties = (state, body) => {
  const currentStatus = ledgerState.getAboutProp(state, 'status')
  if (currentStatus === ledgerStatuses.SERVER_PROBLEM) {
    state = ledgerState.setAboutProp(state, 'status', '')
  }

  if (body == null) {
    return state
  }

  // Addresses
  const addresses = body.get('addresses')
  if (addresses) {
    state = ledgerState.setInfoProp(state, 'addresses', addresses)
  }

  // Update default contribution amount
  let monthly = parseFloat(body.getIn(['parameters', 'adFree', 'fee', 'BAT'])) || 0
  if (monthly < 0 || isNaN(monthly)) {
    monthly = 0
  }

  state = ledgerState.setInfoProp(state, 'contributionAmount', monthly)

  // Balance
  const balance = parseFloat(body.get('balance'))
  if (balance >= 0) {
    state = ledgerState.setInfoProp(state, 'balance', balance)
    if (balance > 0) {
      state = ledgerState.setInfoProp(state, 'userHasFunded', true)
    }
    lockInContributionAmount(state, balance)
  }

  // Rates
  const rates = body.get('rates')
  if (rates != null) {
    state = ledgerState.setInfoProp(state, 'rates', rates)
  }

  // Current currency
  const info = ledgerState.getInfoProps(state)
  const infoRates = info.get('rates')
  const currency = 'USD' // TODO for now it's fixed
  let rate
  if (infoRates) {
    rate = infoRates.get(currency)
  }

  if (rate) {
    state = ledgerState.setInfoProp(state, 'currentRate', rate)
  }

  // Grants
  let probi = parseFloat(body.get('probi'))
  let userFunded = null
  if (!isNaN(probi)) {
    userFunded = probi
    let grants = body.get('grants') || Immutable.List()
    if (!grants.isEmpty()) {
      let grantTotal = 0
      grants = grants.map(grant => {
        grantTotal += parseFloat(grant.get('probi'))
        return {
          amount: new BigNumber(grant.get('probi').toString()).dividedBy('1e18').toNumber(),
          expirationDate: grant.get('expiryTime')
        }
      })
      state = ledgerState.setInfoProp(state, 'grants', grants)
      userFunded = probi - grantTotal
    } else {
      state = ledgerState.setInfoProp(state, 'grants', Immutable.List())
    }

    state = ledgerState.setInfoProp(state, 'userFunded', new BigNumber(userFunded.toString()).dividedBy('1e18').toNumber())
  }

  // Probi
  if (probi >= 0) {
    state = ledgerState.setInfoProp(state, 'probi', probi)
    if (userFunded != null && rate) {
      const bigProbi = new BigNumber(userFunded.toString()).dividedBy('1e18')
      const bigRate = new BigNumber(rate.toString())
      const converted = bigProbi.times(bigRate).toNumber()

      state = ledgerState.setInfoProp(state, 'converted', converted)
    }
  }

  // monthly amount list
  let list = body.getIn(['parameters', 'adFree', 'choices', 'BAT'])
  if (list == null || !Immutable.List.isList(list) || list.isEmpty()) {
    list = ledgerUtil.defaultMonthlyAmounts
  }

  const currentAmount = ledgerState.getContributionAmount(state)
  if (!list.includes(currentAmount)) {
    list = list.push(currentAmount).sort()
  }
  state = ledgerState.setInfoProp(state, 'monthlyAmounts', list)

  // unconfirmed amount
  const unconfirmed = parseFloat(body.get('unconfirmed'))
  if (unconfirmed >= 0) {
    state = ledgerState.setInfoProp(state, 'unconfirmed', unconfirmed)
    if (clientOptions.verboseP) {
      console.log('\ngetBalance refreshes ledger info: ' + ledgerState.getInfoProp(state, 'unconfirmed'))
    }
  }

  if (clientOptions.verboseP) {
    console.log('\nWalletProperties refreshes payment info')
  }

  state = module.exports.generatePaymentData(state)
  if (state.getIn(['about', 'preferences']) != null && aboutPreferencesState.getRecoveryBalanceRecalulated(state) === false) {
    state = aboutPreferencesState.setRecoveryBalanceRecalculated(state, true)
  }
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
    }, 2 * ledgerUtil.milliseconds.second)
  }

  amount = parseFloat(amount)
  if (isNaN(amount) || (amount <= 0)) return

  let currency = 'USD'
  const addresses = client.getWalletAddresses()

  if (addresses && addresses.BAT) {
    currency = 'BAT'
  }

  underscore.extend(bravery.fee, { amount: amount, currency: currency })
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
    if (result.properties && result.properties.wallet && result.properties.wallet.keyinfo) {
      result.properties.wallet.keyinfo.seed = uintKeySeed(result.properties.wallet.keyinfo.seed)
    }
    muonWriter(statePath, result)
  }

  return state
}

const uintKeySeed = (currentSeed) => {
  if (currentSeed == null) {
    return currentSeed
  }

  if (currentSeed instanceof Object) {
    return new Uint8Array(Object.values(currentSeed))
  }

  try {
    currentSeed.toJSON()
    return new Uint8Array(Object.values(currentSeed))
  } catch (err) { }

  return currentSeed
}

const getBalance = (state) => {
  const inProgress = ledgerState.getAboutProp(state, 'status') === ledgerStatuses.IN_PROGRESS
  if (!client || inProgress) return

  const balanceFn = module.exports.getBalance.bind(null, state)
  balanceTimeoutId = setTimeout(balanceFn, 1 * ledgerUtil.milliseconds.minute)
  return module.exports.getPaymentInfo(state)
}

const callback = (err, result, delayTime) => {
  if (clientOptions.verboseP) {
    console.log('\nledger client callback: clientP=' + (!!client) + ' errP=' + (!!err) + ' resultP=' + (!!result) +
      ' delayTime=' + delayTime)
  }

  if (err) {
    console.error('ledger client error(1): ' + JSON.stringify(err, null, 2) + (err.stack ? ('\n' + err.stack) : ''))
    if (!client) return

    if (typeof delayTime === 'undefined') {
      delayTime = random.randomInt({min: ledgerUtil.milliseconds.minute, max: 5 * ledgerUtil.milliseconds.minute})
    }
  }

  appActions.onLedgerCallback(result, delayTime)
}

const onCallback = (state, result, delayTime) => {
  let results
  let entries = client && client.report()

  if (!result) {
    run(state, delayTime)
    return state
  }

  if (result.getIn(['currentReconcile', 'timestamp']) === 0) {
    state = ledgerState.setAboutProp(state, 'status', ledgerStatuses.IN_PROGRESS)
  }

  const newAddress = result.getIn(['properties', 'wallet', 'addresses', 'BAT'])
  const oldAddress = ledgerState.getInfoProps(state).getIn(['addresses', 'BAT'])

  if (newAddress !== oldAddress) {
    state = ledgerState.setInfoProp(state, 'walletQR', Immutable.Map())
  }

  const seed = result.getIn(['properties', 'wallet', 'keyinfo', 'seed'])
  if (seed) {
    result = result.setIn(['properties', 'wallet', 'keyinfo', 'seed'], uintKeySeed(seed))
  }

  const regularResults = result.toJS()
  const notInProgress = ledgerState.getAboutProp(state, 'status') !== ledgerStatuses.IN_PROGRESS

  if (client && result.getIn(['properties', 'wallet'])) {
    if (!ledgerState.getInfoProp(state, 'created')) {
      module.exports.setPaymentInfo(ledgerState.getContributionAmount(state))
    }

    state = getStateInfo(state, regularResults) // TODO optimize if possible

    if (notInProgress) {
      state = module.exports.getPaymentInfo(state)
    }
  }

  if (notInProgress) {
    state = module.exports.cacheRuleSet(state, regularResults.ruleset)
    if (result.has('rulesetV2')) {
      results = regularResults.rulesetV2 // TODO optimize if possible
      delete regularResults.rulesetV2

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
          const publisher = item[1] || Immutable.Map()

          if (!publisher.getIn(['options', 'exclude'])) {
            excludeP(publisherKey, (unused, exclude) => {
              appActions.onPublisherOptionUpdate(publisherKey, 'exclude', exclude)
              savePublisherOption(publisherKey, 'exclude', exclude)
            })
          }
        }
      })
    }

    if (result.has('publishersV2')) {
      delete regularResults.publishersV2
    }
  }

  // persist the new ledger state
  muonWriter(statePath, regularResults)

  run(state, delayTime)

  return state
}

const onReferralCodeRead = (code) => {
  if (!code) {
    fetchReferralHeaders()
    return
  }

  code = code.trim()

  if (code.length > 0) {
    module.exports.roundtrip({
      server: referralServer,
      method: 'PUT',
      path: '/promo/initialize/nonua',
      payload: {
        api_key: referralAPI,
        referral_code: code,
        platform: platform
      }
    }, {}, onReferralInit)
  }
}

const onReferralInit = (err, response, body) => {
  if (err) {
    if (clientOptions.verboseP) {
      console.error(err)
    }
    return
  }

  if (body && body.download_id) {
    appActions.onReferralCodeRead(body)
    promoCodeFirstRunStorage
      .removePromoCode()
      .catch(error => {
        if (clientOptions.verboseP) {
          console.error('read error: ' + error.toString())
        }
      })
    return
  }

  if (clientOptions.verboseP) {
    console.error(`Referral check was not successful ${body}`)
  }
}

const onReferralRead = (state, body, activeWindowId) => {
  body = makeImmutable(body)

  if (body.has('offer_page_url')) {
    const url = body.get('offer_page_url')
    if (urlutil.isURL(url)) {
      if (activeWindowId === windowState.WINDOW_ID_NONE || !state.get('windowReady')) {
        // write referralPage to state if initial window is not created/visible yet
        state = updateState.setUpdateProp(state, 'referralPage', url)
      } else {
        // initial window exists and should be ready; create tab directly
        appActions.createTabRequested({
          url,
          windowId: activeWindowId,
          active: true
        })
        state = updateState.setUpdateProp(state, 'referralPage', null)
      }
    }
  }

  if (body.has('headers')) {
    const headers = body.get('headers')
    state = updateState.setUpdateProp(state, 'referralHeaders', headers)
    siteHacks.setReferralHeaders(headers)
  }

  state = updateState.setUpdateProp(state, 'referralDownloadId', body.get('download_id'))
  state = updateState.setUpdateProp(state, 'referralPromoCode', body.get('referral_code'))

  return state
}

const fetchReferralHeaders = () => {
  module.exports.roundtrip({
    server: referralServer,
    method: 'GET',
    path: '/promo/custom-headers'
  }, {}, appActions.onFetchReferralHeaders)
}

const onFetchReferralHeaders = (state, err, response, body) => {
  if (err) {
    if (clientOptions.verboseP) {
      console.error(makeJS(err))
    }
    return state
  }

  if (body && isList(body)) {
    state = updateState.setUpdateProp(state, 'referralHeaders', body)
    siteHacks.setReferralHeaders(body)
  }

  return state
}

const initialize = (state, paymentsEnabled) => {
  let fs

  if (!v2RulesetDB) v2RulesetDB = levelUp(pathName(v2RulesetPath))
  state = enable(state, paymentsEnabled)

  ledgerNotifications.init()

  if (verifiedTimeoutId) {
    clearInterval(verifiedTimeoutId)
  }

  if (!userAgent) {
    const versionInformation = state.getIn(['about', 'brave', 'versionInformation'])
    if (versionInformation) {
      userAgent = [
        `Brave/${versionInformation.get('Brave')}`,
        `Chrome/${versionInformation.get('libchromiumcontent')}`,
        `Muon/${versionInformation.get('Muon')}`,
        versionInformation.get('OS Platform'),
        versionInformation.get('OS Architecture')
      ].join(' ')
    }
  }

  if (updateState.getUpdateProp(state, 'referralDownloadId') == null) {
    promoCodeFirstRunStorage
      .readFirstRunPromoCode()
      .then((code) => {
        onReferralCodeRead(code)
      })
      .catch(error => {
        if (clientOptions.verboseP) {
          console.error('read error: ' + error.toString())
        }
        fetchReferralHeaders()
      })
  } else {
    fetchReferralHeaders()
  }

  // Get referral headers every day
  setInterval(() => fetchReferralHeaders, (24 * ledgerUtil.milliseconds.hour))

  if (!paymentsEnabled) {
    client = null
    return ledgerState.resetInfo(state, true)
  }

  verifiedTimeoutId = setInterval(getPublisherTimestamp, 1 * ledgerUtil.milliseconds.hour)

  if (client) {
    return state
  }

  if (!ledgerPublisher) ledgerPublisher = require('bat-publisher')
  let ruleset = []
  if (typeof ledgerPublisher.ruleset === 'function') ledgerPublisher.ruleset = ledgerPublisher.ruleset()
  ledgerPublisher.ruleset.forEach(rule => {
    if (rule.consequent) ruleset.push(rule)
  })
  state = cacheRuleSet(state, ruleset)

  try {
    if (!fs) fs = require('fs')
    fs.access(pathName(statePath), fs.FF_OK, (err) => {
      if (err) {
        if (!bootP) {
          module.exports.disablePayments()
        }
        return
      }

      fs.readFile(pathName(statePath), (err, data) => {
        if (err) {
          module.exports.disablePayments()
          return console.error('read error: ' + err.toString())
        }

        try {
          appActions.onInitRead(JSON.parse(data))
          if (clientOptions.verboseP) {
            console.log('\nstarting up ledger client integration')
          }
        } catch (ex) {
          module.exports.disablePayments()
          console.error('statePath parse error: ' + ex.toString())
        }
      })
    })

    return state
  } catch (err) {
    module.exports.disablePayments()
    if (err.code !== 'ENOENT') {
      console.error('statePath read error: ' + err.toString())
    }
    state = ledgerState.resetInfo(state)
    return state
  }
}

const getContributionAmount = (state) => {
  return ledgerState.getContributionAmount(state)
}

const onInitRead = (state, parsedData) => {
  const isBTC = parsedData &&
    parsedData.properties &&
    parsedData.properties.wallet &&
    parsedData.properties.wallet.keychains

  if (isBTC) {
    const fs = require('fs')
    fs.renameSync(pathName(statePath), pathName('ledger-state-btc.json'))
    state = ledgerState.resetInfo(state)
    clientprep()
    client = ledgerClient(null, underscore.extend({roundtrip: roundtrip}, clientOptions), null)
    parsedData = client.state
    getPaymentInfo(state)
    muonWriter(statePath, parsedData)
  }

  if (Array.isArray(parsedData.transactions)) {
    parsedData.transactions.sort((transaction1, transaction2) => {
      return transaction1.submissionStamp - transaction2.submissionStamp
    })
  }

  state = getStateInfo(state, parsedData)

  try {
    let timeUntilReconcile
    clientprep()

    const options = Object.assign({}, clientOptions)
    try {
      if (parsedData.properties.wallet.keychains.user) {
        options.version = 'v1'
      }
    } catch (ex) {}

    client = ledgerClient(parsedData.personaId,
      underscore.extend(parsedData.options, {roundtrip: module.exports.roundtrip}, options),
      parsedData)

    getPublisherTimestamp(true)

    // Scenario: User enables Payments, disables it, waits 30+ days, then
    // enables it again -> reconcileStamp is in the past.
    // In this case reset reconcileStamp to the future.
    try {
      timeUntilReconcile = client.timeUntilReconcile(synopsis, onFuzzing)
    } catch (ex) {}

    let ledgerWindow = (ledgerState.getSynopsisOption(state, 'numFrames') - 1) * ledgerState.getSynopsisOption(state, 'frameSize')
    if (typeof timeUntilReconcile === 'number' && timeUntilReconcile < -ledgerWindow) {
      setNewTimeUntilReconcile()
    }
  } catch (ex) {
    module.exports.disablePayments()
    console.error('ledger client creation error(1): ', ex)
    return state
  }

  // speed-up browser start-up by delaying the first synchronization action
  setTimeout(() => {
    if (!client) {
      return
    }

    appActions.onLedgerFirstSync(parsedData)
  }, 3 * ledgerUtil.milliseconds.second)

  // Make sure bravery props are up-to-date with user settings
  const address = ledgerState.getInfoProp(state, 'address')
  if (address) {
    state = ledgerState.setInfoProp(state, 'address', client.getWalletAddress())
  }

  const contributionAmount = getContributionAmount(state)
  module.exports.setPaymentInfo(contributionAmount)
  module.exports.getBalance(state)

  return state
}

const onFuzzing = (pushBack, pruned = false) => {
  if (client && client.state) {
    const newStamp = pushBack ? client.state.reconcileStamp : null
    appActions.onLedgerFuzzing(newStamp, pruned)
  }
}

const onTimeUntilReconcile = (state, stateResult) => {
  state = getStateInfo(state, stateResult.toJS()) // TODO optimize
  muonWriter(statePath, stateResult)

  return state
}

const onLedgerFirstSync = (state, parsedData) => {
  if (client.sync(callback) === true) {
    run(state, random.randomInt({min: ledgerUtil.milliseconds.minute, max: 5 * ledgerUtil.milliseconds.minute}))
  }

  return cacheRuleSet(state, parsedData.ruleset)
}

const init = (state) => {
  return initialize(state, getSetting(settings.PAYMENTS_ENABLED))
}

const run = (state, delayTime) => {
  let noDelay = false
  if (process.env.LEDGER_NO_DELAY) {
    noDelay = ledgerClient.prototype.boolion(process.env.LEDGER_NO_DELAY)
  }

  if (clientOptions.verboseP) {
    console.log('\nledger client run: clientP=' + (!!client) + ' delayTime=' + delayTime + (noDelay ? ' LEDGER_NO_DELAY=true' : ''))

    const line = (fields) => {
      let result = ''

      fields.forEach((field) => {
        const max = (result.length > 0) ? 45 : 19

        if (!field) {
          return
        }

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

  if (state == null || typeof delayTime === 'undefined' || !client) {
    return
  }

  const publishers = ledgerState.getAboutProp(state, 'synopsis') || Immutable.List()
  if (isList(publishers) && publishers.isEmpty() && client.isReadyToReconcile(synopsis, onFuzzing)) {
    setNewTimeUntilReconcile()
  }

  let winners
  const ballots = client.ballots()
  const data = (synopsis) && (ballots > 0) && synopsisNormalizer(state, null, false, true)

  let map = null

  if (data) {
    let weights = []
    map = {}

    data.forEach((datum) => {
      map[datum.publisherKey] = {
        verified: datum.verified,
        exclude: datum.exclude,
        score: datum.score,
        pinPercentage: datum.pinPercentage,
        percentage: datum.percentage,
        votes: 0,
        weight: datum.weight
      }

      weights.push({
        publisher: datum.publisherKey,
        pinPercentage: datum.pinPercentage,
        weight: datum.weight / 100.0
      })
    })

    winners = synopsis.winners(ballots, weights) || []

    winners.forEach((winner) => {
      if (map[winner]) map[winner].votes++
    })

    client.memo('run:ballots', Object.values(map))
  }

  if (!winners) winners = []

  try {
    let stateData
    winners.forEach((winner) => {
      if (!ledgerUtil.contributeP(state, winner)) return

      const result = client.vote(winner)
      if (result) stateData = result
    })
    if (!stateData && map) {
      stateData = client.state
    }
    if (stateData) muonWriter(statePath, stateData)
  } catch (ex) {
    console.error('ledger client error(2): ' + ex.toString() + (ex.stack ? ('\n' + ex.stack) : ''))
  }

  if (delayTime === 0) {
    try {
      delayTime = client.timeUntilReconcile(synopsis, onFuzzing)
    } catch (ex) {
      delayTime = false
    }
    if (delayTime === false) {
      delayTime = random.randomInt({min: ledgerUtil.milliseconds.minute, max: 5 * ledgerUtil.milliseconds.minute})
    }
  }

  if (delayTime > 0) {
    if (runTimeoutId) return
    // useful for QA - #12249
    if (noDelay) delayTime = 3000

    const active = client
    if (delayTime > (1 * ledgerUtil.milliseconds.hour)) {
      delayTime = random.randomInt({min: 3 * ledgerUtil.milliseconds.minute, max: ledgerUtil.milliseconds.hour})
    }

    runTimeoutId = setTimeout(() => {
      runTimeoutId = false
      if (active !== client) return

      if (!client) {
        return console.error('\n\n*** MTR says this can\'t happen(1)... please tell him that he\'s wrong!\n\n')
      }

      if (client.sync(callback) === true) {
        appActions.onLedgerRun(0)
      }
    }, delayTime)
    return
  }

  if (client.isReadyToReconcile(synopsis, onFuzzing)) {
    client.reconcile(uuid.v4().toLowerCase(), callback)
  }
}

const networkConnected = () => {
  underscore.debounce(() => {
    if (!client) return

    appActions.onNetworkConnected()
  }, 1 * ledgerUtil.milliseconds.minute, true)
}

const onNetworkConnected = (state) => {
  if (runTimeoutId) {
    clearTimeout(runTimeoutId)
    runTimeoutId = false
  }

  if (client.sync(callback) === true) {
    const delayTime = random.randomInt({min: ledgerUtil.milliseconds.minute, max: 5 * ledgerUtil.milliseconds.minute})
    run(state, delayTime)
  }

  if (balanceTimeoutId) clearTimeout(balanceTimeoutId)
  const newBalance = module.exports.getBalance.bind(null, state)
  balanceTimeoutId = setTimeout(newBalance, 5 * ledgerUtil.milliseconds.second)
}

const muonWriter = (fileName, payload) => {
  const path = pathName(fileName)
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
  const fs = require('fs')
  const synopsisOptions = ledgerState.getSynopsisOptions(state)

  if (synopsisOptions.isEmpty()) {
    // Move data from synopsis file into appState
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
    } catch (err) {}

    // Delete ledgerInfo
    state = state.delete('ledgerInfo')

    // Move locationInfo into ledger
    if (state.has('locationInfo')) {
      const locationInfo = state.get('locationInfo')
      state = state.setIn(['ledger', 'locations'], locationInfo)
      state = state.delete('locationInfo')
    }
  }

  const oldDb = pathName('ledger-publishersV2.leveldb')
  fs.access(oldDb, fs.FF_OK, (err, result) => {
    if (err) {
      return
    }

    const fsExtra = require('fs-extra')
    fsExtra.remove(oldDb)
  })

  return state
}

const setPublishersOptions = (state, publishersArray) => {
  if (!publishersArray || publishersArray.size === 0) {
    return state
  }

  publishersArray.forEach(publisherData => {
    const publisherKey = publisherData.get('publisherKey')

    if (publisherKey == null) {
      return state
    }

    for (const data of publisherData) {
      const prop = data[0]
      const value = data[1]
      if (prop !== 'publisherKey') {
        state = ledgerState.setPublisherOption(state, publisherKey, prop, value)
        module.exports.savePublisherOption(publisherKey, prop, value)
      }
    }
  })

  return state
}

// for synopsis variable handling only
const deleteSynopsisPublisher = (publisherKey) => {
  delete synopsis.publishers[publisherKey]
}

const saveOptionSynopsis = (prop, value) => {
  synopsis.options[prop] = value
}

const savePublisherOption = (publisherKey, prop, value) => {
  if (!synopsis || !synopsis.publishers || !publisherKey) {
    return
  }

  if (!synopsis.publishers[publisherKey]) {
    synopsis.publishers[publisherKey] = {}
  }

  if (!synopsis.publishers[publisherKey].options) {
    synopsis.publishers[publisherKey].options = {}
  }

  synopsis.publishers[publisherKey].options[prop] = value
}

const savePublisherData = (publisherKey, prop, value) => {
  if (!synopsis || !synopsis.publishers || !publisherKey) {
    return
  }

  if (!synopsis.publishers[publisherKey]) {
    synopsis.publishers[publisherKey] = {}
  }

  synopsis.publishers[publisherKey][prop] = value
}

let currentMediaKey = null
const onMediaRequest = (state, xhr, type, details) => {
  if (!xhr || type == null) {
    return state
  }

  const parsed = ledgerUtil.getMediaData(xhr, type, details)
  if (parsed == null) {
    return state
  }

  if (Array.isArray(parsed)) {
    parsed.forEach(data => {
      if (data) {
        state = module.exports.processMediaData(state, data, type, details)
      }
    })
  } else {
    state = module.exports.processMediaData(state, parsed, type, details)
  }

  return state
}

const processMediaData = (state, parsed, type, details) => {
  let tabId = tabState.TAB_ID_NONE
  if (details) {
    tabId = details.get('tabId')
  }

  const mediaId = ledgerUtil.getMediaId(parsed, type)

  if (clientOptions.loggingP) {
    console.log('Media request', parsed, `Media id: ${mediaId}`)
  }

  if (mediaId == null) {
    return state
  }

  const mediaKey = ledgerUtil.getMediaKey(mediaId, type)
  let duration = ledgerUtil.getMediaDuration(state, parsed, mediaKey, type)

  if (duration == null || mediaKey == null) {
    return state
  }

  // Don't record if visit is in private tab
  if (!shouldTrackTab(state, tabId)) {
    return state
  }

  if (!ledgerPublisher) {
    ledgerPublisher = require('bat-publisher')
  }
  if (clientOptions.loggingP) {
    console.log('LOGGED EVENT', parsed, `Media id: ${mediaId}`, `Media key: ${mediaKey}`, `Duration: ${duration}ms (${duration / 1000}s)`)
  }

  let revisited = true
  const activeTabId = tabState.getActiveTabId(state)
  if (activeTabId === tabId && mediaKey !== currentMediaKey) {
    revisited = false
    currentMediaKey = mediaKey
  }

  const stateData = ledgerUtil.generateMediaCacheData(state, parsed, type, mediaKey)
  const cache = ledgerVideoCache.getDataByVideoId(state, mediaKey)
  if (clientOptions.loggingP) {
    console.log('Media cache data: ', stateData.toJS())
  }

  if (!cache.isEmpty()) {
    if (!stateData.isEmpty()) {
      state = ledgerVideoCache.mergeCacheByVideoId(state, mediaKey, stateData)
    }

    const publisherKey = cache.get('publisher')
    const publisher = ledgerState.getPublisher(state, publisherKey)
    if (!publisher.isEmpty() && publisher.has('providerName')) {
      return module.exports.saveVisit(state, publisherKey, {
        duration,
        revisited,
        ignoreMinTime: true
      })
    }
  }

  if (!stateData.isEmpty()) {
    state = ledgerVideoCache.setCacheByVideoId(state, mediaKey, stateData)
  }

  const options = underscore.extend({roundtrip: module.exports.roundtrip}, clientOptions)
  const mediaProps = {
    mediaId,
    providerName: type
  }

  ledgerPublisher.getMedia().getPublisherFromMediaProps(mediaProps, options, (error, response) => {
    if (error) {
      console.error('Error while getting publisher from media', error.toString())
      return
    }

    // publisher not found
    if (!response) {
      return
    }

    if (_internal.verboseP) {
      console.log('\ngetPublisherFromMediaProps mediaProps=' + JSON.stringify(mediaProps, null, 2) + '\nresponse=' +
        JSON.stringify(response, null, 2))
    }

    appActions.onLedgerMediaPublisher(mediaKey, response, duration, revisited)
  })

  return state
}

const onMediaPublisher = (state, mediaKey, response, duration, revisited) => {
  const publisherKey = response ? response.get('publisher') : null
  if (publisherKey == null) {
    return state
  }

  let publisher = ledgerState.getPublisher(state, publisherKey)
  const faviconName = response.get('faviconName')
  const faviconURL = response.get('faviconURL')
  const publisherURL = response.get('publisherURL')
  const providerName = response.get('providerName')

  if (!synopsis.publishers[publisherKey] || publisher.isEmpty()) {
    synopsis.initPublisher(publisherKey)

    if (!synopsis.publishers[publisherKey]) {
      return state
    }

    state = ledgerState.setPublisher(state, publisherKey, synopsis.publishers[publisherKey])

    if (!getSetting(settings.PAYMENTS_SITES_AUTO_SUGGEST)) {
      appActions.onPublisherOptionUpdate(publisherKey, 'exclude', true)
      savePublisherOption(publisherKey, 'exclude', true)
    } else {
      excludeP(publisherKey, (unused, exclude) => {
        appActions.onPublisherOptionUpdate(publisherKey, 'exclude', exclude)
        savePublisherOption(publisherKey, 'exclude', exclude)
      })
    }
  }

  savePublisherData(publisherKey, 'faviconName', faviconName)
  savePublisherData(publisherKey, 'faviconURL', faviconURL)
  savePublisherData(publisherKey, 'publisherURL', publisherURL)
  savePublisherData(publisherKey, 'providerName', providerName)
  state = ledgerState.setPublishersProp(state, publisherKey, 'faviconName', faviconName)
  state = ledgerState.setPublishersProp(state, publisherKey, 'faviconURL', faviconURL)
  state = ledgerState.setPublishersProp(state, publisherKey, 'publisherURL', publisherURL)
  state = ledgerState.setPublishersProp(state, publisherKey, 'providerName', providerName)

  if (publisher.isEmpty()) {
    revisited = false
  }

  const cacheObject = Immutable.Map()
    .set('publisher', publisherKey)

  // Add to cache
  state = ledgerVideoCache.mergeCacheByVideoId(state, mediaKey, cacheObject)

  state = module.exports.saveVisit(state, publisherKey, {
    duration,
    revisited,
    ignoreMinTime: true
  })

  return state
}

const getPromotion = (state) => {
  if (!getSetting(settings.PAYMENTS_ALLOW_PROMOTIONS)) {
    return
  }

  let tempClient = client
  let paymentId = null
  if (!tempClient) {
    clientprep()
    tempClient = ledgerClient(null, underscore.extend({roundtrip: module.exports.roundtrip}, clientOptions), null)
    paymentId = ledgerState.getInfoProp(state, 'paymentId')
  }

  const lang = getSetting(settings.LANGUAGE)

  tempClient.getPromotion(lang, paymentId, (err, result) => {
    if (err) {
      if (clientOptions.verboseP) {
        console.error('Error retrieving promotion', err.toString())
      }
      return
    }

    appActions.saveLedgerPromotion(result)
  })
}

const getCaptcha = (state) => {
  if (!client) {
    return
  }

  const promotion = ledgerState.getPromotion(state)
  if (promotion.isEmpty()) {
    return
  }

  client.getPromotionCaptcha(promotion.get('promotionId'), (err, body, response) => {
    if (err) {
      console.error(`Problem getting promotion captcha ${err.toString()}`)
      appActions.onCaptchaResponse(response, null)
      return
    }

    appActions.onCaptchaResponse(null, body)
  })
}

const onCaptchaResponse = (state, response, body) => {
  if (body == null) {
    if (response && response.get('statusCode') === 429) {
      return ledgerState.setPromotionProp(state, 'promotionStatus', promotionStatuses.CAPTCHA_BLOCK)
    }

    return ledgerState.setPromotionProp(state, 'promotionStatus', promotionStatuses.CAPTCHA_ERROR)
  }

  const image = `data:image/jpeg;base64,${Buffer.from(body).toString('base64')}`

  state = ledgerState.setPromotionProp(state, 'captcha', image)
  const currentStatus = ledgerState.getPromotionProp(state, 'promotionStatus')

  if (currentStatus !== promotionStatuses.CAPTCHA_ERROR) {
    state = ledgerState.setPromotionProp(state, 'promotionStatus', promotionStatuses.CAPTCHA_CHECK)
  }

  return state
}

const claimPromotion = (state, x, y) => {
  if (!client) {
    return
  }

  const promotion = ledgerState.getPromotion(state)
  if (promotion.isEmpty()) {
    return
  }

  client.setPromotion(promotion.get('promotionId'), {x, y}, (err, _, status) => {
    let param = null
    if (err) {
      console.error(`Problem claiming promotion ${err.toString()}`)
      param = status
    }

    appActions.onPromotionResponse(param)
  })
}

const onPromotionResponse = (state, status) => {
  if (status && isImmutable(status)) {
    if (status.get('statusCode') === 422) {
      // promotion already claimed
      state = ledgerState.setPromotionProp(state, 'promotionStatus', promotionStatuses.PROMO_EXPIRED)
    } else if (status.get('statusCode') === 403) {
      // captcha verification failed
      state = ledgerState.setPromotionProp(state, 'promotionStatus', promotionStatuses.CAPTCHA_ERROR)
      module.exports.getCaptcha(state)
    } else if (status.get('statusCode') === 429) {
      // too many attempts
      state = ledgerState.setPromotionProp(state, 'promotionStatus', promotionStatuses.CAPTCHA_BLOCK)
    } else {
      // general error
      state = ledgerState.setPromotionProp(state, 'promotionStatus', promotionStatuses.GENERAL_ERROR)
    }
    return state
  }

  const currentStatus = ledgerState.getPromotionProp(state, 'promotionStatus')

  if (
    currentStatus === promotionStatuses.CAPTCHA_ERROR ||
    currentStatus === promotionStatuses.CAPTCHA_CHECK ||
    currentStatus === promotionStatuses.CAPTCHA_BLOCK
  ) {
    state = ledgerState.setPromotionProp(state, 'promotionStatus', null)
  }

  ledgerNotifications.removePromotionNotification(state)
  state = ledgerState.setPromotionProp(state, 'claimedTimestamp', new Date().getTime())

  const currentTimestamp = ledgerState.getInfoProp(state, 'reconcileStamp')
  const minTimestamp = ledgerState.getPromotionProp(state, 'minimumReconcileTimestamp')

  if (minTimestamp > currentTimestamp) {
    setNewTimeUntilReconcile(minTimestamp)
  }

  if (togglePromotionTimeoutId) {
    clearTimeout(togglePromotionTimeoutId)
  }

  module.exports.getBalance(state)

  return state
}

const onPublisherTimestamp = (state, oldTimestamp, newTimestamp) => {
  if (oldTimestamp === newTimestamp) {
    return
  }

  const publishers = ledgerState.getPublishers(state)
  if (publishers.isEmpty()) {
    return
  }

  module.exports.checkVerifiedStatus(state, Array.from(publishers.keys()), newTimestamp)
}

const checkReferralActivity = (state) => {
  const downloadId = updateState.getUpdateProp(state, 'referralDownloadId')

  if (!downloadId) {
    updater.checkForUpdate(false, true)
    return state
  }

  const timestamp = updateState.getUpdateProp(state, 'referralAttemptTimestamp') || 0
  const count = updateState.getUpdateProp(state, 'referralAttemptCount') || 0

  if (count >= 30) {
    if (clientOptions.verboseP) {
      console.log('I tried 30 times, but now I need to stop trying. (Referral program)')
    }
    state = updateState.deleteUpdateProp(state, 'referralAttemptTimestamp')
    state = updateState.deleteUpdateProp(state, 'referralAttemptCount')
    state = updateState.deleteUpdateProp(state, 'referralDownloadId')
    updater.checkForUpdate(false, true)
    return state
  }

  const time = new Date().getTime()
  if (time - timestamp >= ledgerUtil.milliseconds.hour * 24) {
    state = updateState.setUpdateProp(state, 'referralAttemptCount', count + 1)
    state = updateState.setUpdateProp(state, 'referralAttemptTimestamp', time)

    module.exports.roundtrip({
      server: referralServer,
      method: 'PUT',
      path: '/promo/activity',
      payload: {
        download_id: downloadId,
        api_key: referralAPI
      }
    }, {}, activityRoundTrip)
  } else {
    updater.checkForUpdate(false, true)
  }

  return state
}

const referralCheck = (state) => {
  const installTime = state.get('firstRunTimestamp')
  const period = parseInt(process.env.LEDGER_REFERRAL_DELETE_TIME || (ledgerUtil.milliseconds.day * 90))

  if (new Date().getTime() >= installTime + period) {
    state = updateState.deleteUpdateProp(state, 'referralPromoCode')
  }

  return state
}

const activityRoundTrip = (err, response, body) => {
  if (err) {
    if (clientOptions.verboseP) {
      console.error(err)
    }
    updater.checkForUpdate(false, true)
    return
  }

  if (body && body.finalized) {
    appActions.onReferralActivity()
    return
  }

  if (clientOptions.verboseP) {
    console.log('Referral is still not ready, please wait at least 30days')
  }

  updater.checkForUpdate(false, true)
}

const disablePayments = () => {
  if (clientOptions.verboseP) {
    console.log('\nDisabling payments due to missing/corrupted state file')
  }
  appActions.changeSetting(settings.PAYMENTS_ENABLED, false)
}

const deleteWallet = (state) => {
  state = ledgerState.deleteSynopsis(state)
  state = state.setIn(['settings', settings.PAYMENTS_ENABLED], false)

  client = null
  synopsis = null

  const fs = require('fs')
  fs.access(pathName(statePath), fs.constants.F_OK, (err) => {
    if (err) {
      return
    }

    fs.unlink(pathName(statePath), (err) => {
      if (err) {
        return console.error('read error: ' + err.toString())
      }
    })
  })

  return state
}

const clearPaymentHistory = (state) => {
  state = ledgerState.setInfoProp(state, 'transactions', Immutable.List())
  state = ledgerState.setInfoProp(state, 'ballots', Immutable.List())
  state = ledgerState.setInfoProp(state, 'batch', Immutable.Map())

  const fs = require('fs')
  const path = pathName(statePath)
  try {
    fs.accessSync(path, fs.constants.W_OK)
    let data = fs.readFileSync(path)
    data = JSON.parse(data)
    if (data) {
      data.transactions = []
      data.ballots = []
      data.batch = {}
      muonWriter(statePath, data)
    }
  } catch (err) {
    console.error(`Problem reading ${path} when clearing payment history`)
  }

  return state
}

const getMethods = () => {
  const publicMethods = {
    backupKeys,
    recoverKeys,
    quit,
    pageDataChanged,
    init,
    initialize,
    setPaymentInfo,
    updatePublisherInfo,
    networkConnected,
    verifiedP,
    boot,
    onBootStateFile,
    onWalletProperties,
    paymentPresent,
    addFoundClosed,
    onWalletRecovery,
    onBraveryProperties,
    onLedgerFirstSync,
    onCallback,
    deleteSynopsisPublisher,
    saveOptionSynopsis,
    savePublisherOption,
    onTimeUntilReconcile,
    run,
    onNetworkConnected,
    migration,
    onInitRead,
    normalizePinned,
    roundToTarget,
    onFavIconReceived,
    savePublisherData,
    pruneSynopsis,
    onMediaRequest,
    onMediaPublisher,
    saveVisit,
    generatePaymentData,
    claimPromotion,
    onPromotionResponse,
    getBalance,
    fileRecoveryKeys,
    getPromotion,
    onPublisherTimestamp,
    checkVerifiedStatus,
    checkReferralActivity,
    setPublishersOptions,
    referralCheck,
    roundtrip,
    onFetchReferralHeaders,
    onReferralRead,
    processMediaData,
    addNewLocation,
    addSiteVisit,
    getCaptcha,
    onCaptchaResponse,
    shouldTrackTab,
    deleteWallet,
    resetPublishers,
    clearPaymentHistory,
    getPaymentInfo,
    synopsisNormalizer,
    cacheRuleSet,
    disablePayments
  }

  let privateMethods = {}

  if (process.env.NODE_ENV === 'test') {
    privateMethods = {
      enable,
      addSiteVisit,
      clearVisitsByPublisher: function () {
        visitsByPublisher = {}
      },
      getVisitsByPublisher: function () {
        return visitsByPublisher
      },
      getSynopsis: () => synopsis,
      setSynopsis: (data) => {
        synopsis = data
      },
      getClient: () => {
        return client
      },
      setClient: (data) => {
        client = data
      },
      setCurrentMediaKey: (key) => {
        currentMediaKey = key
      },
      getCurrentMediaKey: (key) => currentMediaKey,
      observeTransactions,
      onWalletRecovery,
      getStateInfo,
      lockInContributionAmount,
      callback,
      uintKeySeed,
      loadKeysFromBackupFile,
      activityRoundTrip,
      pathName,
      onReferralInit,
      roundTripFromWindow,
      onReferralCodeRead,
      onVerifiedPStatus,
      onFuzzing,
      checkSeed,
      shouldTrackTab
    }
  }

  return Object.assign({}, publicMethods, privateMethods)
}

module.exports = getMethods()
