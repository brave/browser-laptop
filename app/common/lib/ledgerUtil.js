/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const acorn = require('acorn')
const moment = require('moment')
const Immutable = require('immutable')
const electron = require('electron')
const path = require('path')
const os = require('os')
const qr = require('qr-image')
const underscore = require('underscore')
const tldjs = require('tldjs')
const urlFormat = require('url').format
const queryString = require('queryString')
const levelUp = require('level')
const random = require('random-lib')

// Actions
const appActions = require('../../../js/actions/appActions')

// State
const ledgerState = require('../state/ledgerState')
const pageDataState = require('../state/pageDataState')

// Constants
const settings = require('../../../js/constants/settings')

// Utils
const {responseHasContent} = require('./httpUtil')
const {makeImmutable} = require('../../common/state/immutableUtil')
const tabs = require('../../browser/tabs')
const locale = require('../../locale')
const siteSettingsState = require('../state/siteSettingsState')
const appConfig = require('../../../js/constants/appConfig')
const getSetting = require('../../../js/settings').getSetting
const {fileUrl} = require('../../../js/lib/appUrlUtil')
const urlParse = require('../urlParse')
const ruleSolver = require('../../extensions/brave/content/scripts/pageInformation')
const request = require('../../../js/lib/request')

let ledgerPublisher
let ledgerClient
let ledgerBalance
let client
let locationDefault = 'NOOP'
let currentUrl = locationDefault
let currentTimestamp = new Date().getTime()
let visitsByPublisher = {}
let synopsis
let notificationTimeout
let runTimeoutId

// Database
let v2RulesetDB
const v2RulesetPath = 'ledger-rulesV2.leveldb'
let v2PublishersDB
const v2PublishersPath = 'ledger-publishersV2.leveldb'
const statePath = 'ledger-state.json'

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

const ledgerInfo = {
  _internal: {
    paymentInfo: {}
  }
}

// TODO only temporally so that standard is happy
const publisherInfo = {
  _internal: {
    verboseP: true,
    debugP: true,
    enabled: false,
    ruleset: {
      raw: [],
      cooked: []
    }
  }
}

/**
 * Is page an actual page being viewed by the user? (not an error page, etc)
 * If the page is invalid, we don't want to collect usage info.
 * @param {Map} view - an entry from ['pageData', 'view']
 * @param {List} responseList - full ['pageData', 'load'] List
 * @return {boolean} true if page should have usage collected, false if not
 */
const shouldTrackView = (view, responseList) => {
  view = makeImmutable(view)

  if (view == null) {
    return false
  }

  const tabId = view.get('tabId')
  const url = view.get('url')

  if (!url || !tabId) {
    return false
  }

  responseList = makeImmutable(responseList)
  if (!responseList || responseList.size === 0) {
    return false
  }

  for (let i = (responseList.size - 1); i > -1; i--) {
    const response = responseList.get(i)

    if (!response) {
      continue
    }

    const responseUrl = response.getIn(['details', 'newURL'], null)

    if (url === responseUrl && response.get('tabId') === tabId) {
      return responseHasContent(response.getIn(['details', 'httpResponseCode']))
    }
  }

  return false
}

const btcToCurrencyString = (btc, ledgerData) => {
  const balance = Number(btc || 0)
  const currency = ledgerData.get('currency') || 'USD'

  if (balance === 0) {
    return `0 ${currency}`
  }

  if (ledgerData.get('btc') && typeof ledgerData.get('amount') === 'number') {
    const btcValue = ledgerData.get('btc') / ledgerData.get('amount')
    const fiatValue = (balance / btcValue).toFixed(2)
    let roundedValue = Math.floor(fiatValue)
    const diff = fiatValue - roundedValue

    if (diff > 0.74) {
      roundedValue += 0.75
    } else if (diff > 0.49) {
      roundedValue += 0.50
    } else if (diff > 0.24) {
      roundedValue += 0.25
    }

    return `${roundedValue.toFixed(2)} ${currency}`
  }

  return `${balance} BTC`
}

const formattedTimeFromNow = (timestamp) => {
  moment.locale(navigator.language)
  return moment(new Date(timestamp)).fromNow()
}

const formattedDateFromTimestamp = (timestamp, format) => {
  moment.locale(navigator.language)
  return moment(new Date(timestamp)).format(format)
}

const walletStatus = (ledgerData) => {
  let status = {}

  if (ledgerData.get('error')) {
    status.id = 'statusOnError'
  } else if (ledgerData.get('created')) {
    const transactions = ledgerData.get('transactions')
    const pendingFunds = Number(ledgerData.get('unconfirmed') || 0)

    if (pendingFunds + Number(ledgerData.get('balance') || 0) <
      0.9 * Number(ledgerData.get('btc') || 0)) {
      status.id = 'insufficientFundsStatus'
    } else if (pendingFunds > 0) {
      status.id = 'pendingFundsStatus'
      status.args = {funds: btcToCurrencyString(pendingFunds, ledgerData)}
    } else if (transactions && transactions.size > 0) {
      status.id = 'defaultWalletStatus'
    } else {
      status.id = 'createdWalletStatus'
    }
  } else if (ledgerData.get('creating')) {
    status.id = 'creatingWalletStatus'
  } else {
    status.id = 'createWalletStatus'
  }
  return status
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

const normalizePinned = (dataPinned, total, target, setOne) => {
  return dataPinned.map((publisher) => {
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
}

// courtesy of https://stackoverflow.com/questions/13483430/how-to-make-rounded-percentages-add-up-to-100#13485888
const roundToTarget = (l, target, property) => {
  let off = target - underscore.reduce(l, (acc, x) => { return acc + Math.round(x[property]) }, 0)

  return underscore.sortBy(l, (x) => Math.round(x[property]) - x[property])
    .map((x, i) => {
      x[property] = Math.round(x[property]) + (off > i) - (i >= (l.length + off))
      return x
    })
}

// TODO rename function
const blockedP = (state, publisherKey) => {
  const pattern = `https?://${publisherKey}`
  const ledgerPaymentsShown = siteSettingsState.getSettingsProp(state, pattern, 'ledgerPaymentsShown')

  return ledgerPaymentsShown === false
}

// TODO rename function
const stickyP = (state, publisherKey) => {
  const pattern = `https?://${publisherKey}`
  let result = siteSettingsState.getSettingsProp(state, pattern, 'ledgerPayments')

  // NB: legacy clean-up
  if ((typeof result === 'undefined') && (typeof synopsis.publishers[publisherKey].options.stickyP !== 'undefined')) {
    result = synopsis.publishers[publisherKey].options.stickyP
    appActions.changeSiteSetting(pattern, 'ledgerPayments', result)
  }
  if (synopsis.publishers[publisherKey] &&
    synopsis.publishers[publisherKey].options &&
    synopsis.publishers[publisherKey].options.stickyP) {
    delete synopsis.publishers[publisherKey].options.stickyP
  }

  return (result === undefined || result)
}

// TODO rename function
const eligibleP = (state, publisherKey) => {
  if (!synopsis.options.minPublisherDuration && process.env.NODE_ENV !== 'test') {
    // TODO make sure that appState has correct data in
    synopsis.options.minPublisherDuration = getSetting(settings.PAYMENTS_MINIMUM_VISIT_TIME)
  }

  const scorekeeper = ledgerState.getSynopsisOption(state, 'scorekeeper')
  const minPublisherDuration = ledgerState.getSynopsisOption(state, 'minPublisherDuration')
  const minPublisherVisits = ledgerState.getSynopsisOption(state, 'minPublisherVisits')
  const publisher = ledgerState.getPublisher(state, publisherKey)

  return (
    publisher.getIn(['scores', scorekeeper]) > 0 &&
    publisher.get('duration') >= minPublisherDuration &&
    publisher.get('visits') >= minPublisherVisits
  )
}

// TODO rename function
const visibleP = (state, publisherKey) => {
  const publisher = ledgerState.getPublisher(state, publisherKey)
  // TODO you stopped here
  let showOnlyVerified = ledgerState.getSynopsisOption(state, 'showOnlyVerified')
  if (showOnlyVerified == null) {
    showOnlyVerified = getSetting(settings.PAYMENTS_ALLOW_NON_VERIFIED)
    state = ledgerState.setSynopsisOption(state, 'showOnlyVerified', showOnlyVerified)
    synopsis.options.showOnlyVerified = showOnlyVerified
  }

  const publisherOptions = publisher.get('options', Immutable.Map())
  const onlyVerified = !showOnlyVerified

  // Publisher Options
  const excludedByUser = blockedP(state, publisherKey)
  const eligibleByPublisherToggle = stickyP(state, publisherKey) != null
  const eligibleByNumberOfVisits = eligibleP(state, publisherKey)
  const isInExclusionList = publisherOptions.get('exclude')
  const verifiedPublisher = publisherOptions.get('verified')

  // websites not included in exclusion list are eligible by number of visits
  // but can be enabled by user action in the publisher toggle
  const isEligible = (eligibleByNumberOfVisits && !isInExclusionList) || eligibleByPublisherToggle

  // If user decide to remove the website, don't show it.
  if (excludedByUser) {
    return false
  }

  // Unless user decided to enable publisher with publisherToggle,
  // do not show exclusion list.
  if (!eligibleByPublisherToggle && isInExclusionList) {
    return false
  }

  // If verified option is set, only show verified publishers
  if (isEligible && onlyVerified) {
    return verifiedPublisher
  }

  return isEligible
}

const synopsisNormalizer = (state, publishers, options, changedPublisher) => {
  let results
  let dataPinned = []
  let dataUnPinned = []
  let dataExcluded = []
  let pinnedTotal = 0
  let unPinnedTotal = 0
  const scorekeeper = options.scorekeeper

  results = [] // TODO convert to Immutable.List
  publishers.forEach((publisher, index) => {
    if (!visibleP(state, index)) {
      return
    }

    publisher.publisher = index
    results.push(publisher)
  })
  results = underscore.sortBy(results, (entry) => { return -entry.scores[scorekeeper] })

  // move publisher to the correct array and get totals
  results.forEach((result) => {
    if (result.pinPercentage && result.pinPercentage > 0) {
      // pinned
      pinnedTotal += result.pinPercentage
      dataPinned.push(getPublisherData(result, scorekeeper))
    } else if (stickyP(result.publisher)) {
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
    state = ledgerState.changePinnedValues(dataPinned)
  } else if (dataUnPinned.length === 0 && pinnedTotal < 100) {
    // when you don't have any unpinned sites and pinned total is less then 100 %
    dataPinned = normalizePinned(dataPinned, pinnedTotal, 100, false)
    dataPinned = roundToTarget(dataPinned, 100, 'pinPercentage')

    // sync app store
    state = ledgerState.changePinnedValues(dataPinned)
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
    synopsis.publishers[item.site].weight = item.weight
    synopsis.publishers[item.site].pinPercentage = item.pinPercentage
  })

  return ledgerState.saveSynopsis(state, newData, options)
}

// TODO make sure that every call assign state
const updatePublisherInfo = (state, changedPublisher) => {
  if (!getSetting(settings.PAYMENTS_ENABLED)) {
    return
  }

  const options = synopsis.options
  state = synopsisNormalizer(state, synopsis.publishers, options, changedPublisher)

  if (publisherInfo._internal.debugP) {
    const data = []
    synopsis.publishers.forEach((entry) => {
      data.push(underscore.extend(underscore.omit(entry, [ 'faviconURL' ]), { faviconURL: entry.faviconURL && '...' }))
    })

    console.log('\nupdatePublisherInfo: ' + JSON.stringify({ options: options, synopsis: data }, null, 2))
  }

  return state
}

// TODO rename function name
// TODO make sure that every call assign state
const verifiedP = (state, publisherKey, callback) => {
  inspectP(v2PublishersDB, v2PublishersPath, publisherKey, 'verified', null, callback)

  if (process.env.NODE_ENV === 'test') {
    ['brianbondy.com', 'clifton.io'].forEach((key) => {
      const publisher = ledgerState.getPublisher(state, key)
      if (!publisher.isEmpty()) {
        state = ledgerState.setSynopsisOption(state, 'verified', true)
      }
    })
    state = updatePublisherInfo(state)
  }

  return state
}

// TODO refactor
const inspectP = (db, path, publisher, property, key, callback) => {
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

// TODO refactor
const excludeP = (publisher, callback) => {
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

  if (!v2RulesetDB) return setTimeout(() => { excludeP(publisher, callback) }, 5 * miliseconds.second)

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
        if ((data.key !== ('TLD:' + props.TLD)) && (props.SLD && data.key !== ('SLD:' + props.SLD.split('.')[0]))) return
      } else {
        try {
          regexp = new RegExp(data.key.substr(4))
          if (!regexp.test(props[tldP ? 'TLD' : 'SLD'])) return
        } catch (ex) {
          console.error(v2RulesetPath + ' stream invalid regexp ' + data.key + ': ' + ex.toString())
        }
      }

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
    return
  }

  const locationData = ledgerState.getLocation(currentUrl)
  if (publisherInfo._internal.verboseP) {
    console.log(
      `locations[${currentUrl}]=${JSON.stringify(locationData, null, 2)} ` +
      `duration=${(timestamp - currentTimestamp)} msec tabId= ${tabId}`
    )
  }
  if (!locationData || !tabId) {
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
  if (publisherInfo._internal.verboseP) {
    console.log('\nadd publisher ' + publisherKey + ': ' + duration + ' msec' + ' revisitP=' + revisitP + ' state=' +
      JSON.stringify(underscore.extend({ location: currentUrl }, visitsByPublisher[publisherKey][currentUrl]),
        null, 2))
  }

  synopsis.addPublisher(publisherKey, { duration: duration, revisitP: revisitP })
  state = updatePublisherInfo(state)
  state = verifiedP(state, publisherKey)

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

// TODO refactor
const pageDataChanged = (state) => {
  // NB: in theory we have already seen every element in info except for (perhaps) the last one...
  const info = pageDataState.getLastInfo(state)

  if (!synopsis || info.isEmpty()) {
    return
  }

  if (info.get('url', '').match(/^about/)) {
    return
  }

  let publisher = info.get('publisher')
  const location = info.get('key')
  if (publisher) {
    // TODO refactor
    if (synopsis.publishers[publisher] &&
      (typeof synopsis.publishers[publisher].faviconURL === 'undefined' || synopsis.publishers[publisher].faviconURL === null)) {
      getFavIcon(synopsis.publishers[publisher], info, location)
    }

    // TODO refactor
    return updateLocation(location, publisher)
  } else {
    try {
      publisher = ledgerPublisher.getPublisher(location, publisherInfo._internal.ruleset.raw)
      // TODO refactor
      if (publisher && !blockedP(state, publisher)) {
        state = pageDataState.setPublisher(state, location, publisher)
      } else {
        publisher = null
      }
    } catch (ex) {
      console.error('getPublisher error for ' + location + ': ' + ex.toString())
    }
  }

  if (!publisher) {
    return
  }

  const pattern = `https?://${publisher}`
  const initP = !synopsis.publishers[publisher]
  // TODO refactor
  synopsis.initPublisher(publisher)

  if (initP) {
    // TODO refactor
    state = excludeP(state, publisher, (unused, exclude) => {
      if (!getSetting(settings.PAYMENTS_SITES_AUTO_SUGGEST)) {
        exclude = false
      } else {
        exclude = !exclude
      }
      appActions.changeSiteSetting(pattern, 'ledgerPayments', exclude)
      updatePublisherInfo()
    })
  }
  // TODO refactor
  updateLocation(location, publisher)
  // TODO refactor
  getFavIcon(synopsis.publishers[publisher], info, location)

  const pageLoad = pageDataState.getLoad(state)
  const view = pageDataState.getView(state)

  if (shouldTrackView(view, pageLoad)) {
    // TODO refactor
    addVisit(view.get('url', 'NOOP'), view.get('timestamp', underscore.now()), view.get('tabId'))
  }

  return state
}

const backupKeys = (state, backupAction) => {
  const date = moment().format('L')
  const paymentId = state.getIn(['ledgerInfo', 'paymentId'])
  const passphrase = state.getIn(['ledgerInfo', 'passphrase'])

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
      return
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

  // TODO should we change this to async await?
  // TODO enable when ledger will work again
  /*
  client.recoverWallet(firstRecoveryKey, secondRecoveryKey, (err, result) => {
    let existingLedgerError = ledgerInfo.error

    if (err) {
      // we reset ledgerInfo.error to what it was before (likely null)
      // if ledgerInfo.error is not null, the wallet info will not display in UI
      // logError sets ledgerInfo.error, so we must we clear it or UI will show an error
      state = logError(err, 'recoveryWallet')
      appActions.updateLedgerInfoProp('error', existingLedgerError)
      // appActions.ledgerRecoveryFailed() TODO update based on top comment (async)
    } else {
      callback(err, result)

      if (balanceTimeoutId) {
        clearTimeout(balanceTimeoutId)
      }
      getBalance()
      // appActions.ledgerRecoverySucceeded()  TODO update based on top comment (async)
    }
  })
  */

  return state
}

const quit = (state) => {
  // quitP = true TODO remove if not needed
  state = addVisit(state, locationDefault, new Date().getTime(), null)

  if ((!getSetting(settings.PAYMENTS_ENABLED)) && (getSetting(settings.SHUTDOWN_CLEAR_HISTORY))) {
    state = ledgerState.resetSynopsis(state)
  }

  return state
}

const initSynopsis = (state) => {
  // cf., the `Synopsis` constructor, https://github.com/brave/ledger-publisher/blob/master/index.js#L167
  let value = getSetting(settings.PAYMENTS_MINIMUM_VISIT_TIME)
  if (!value) {
    value = 8 * 1000
    appActions.changeSetting(settings.PAYMENTS_MINIMUM_VISIT_TIME, value)
  }

  // for earlier versions of the code...
  if ((value > 0) && (value < 1000)) {
    value = value * 1000
    synopsis.options.minPublisherDuration = value
    state = ledgerState.setSynopsisOption(state, 'minPublisherDuration', value)
  }

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

  underscore.keys(synopsis.publishers).forEach((publisher) => {
    excludeP(publisher)
    state = verifiedP(state, publisher)
  })

  state = updatePublisherInfo(state)

  return state
}

const enable = (state, paymentsEnabled) => {
  if (paymentsEnabled && !getSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED)) {
    appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED, true)
  }

  publisherInfo._internal.enabled = paymentsEnabled
  if (synopsis) {
    return updatePublisherInfo(state)
  }

  if (!ledgerPublisher) {
    ledgerPublisher = require('ledger-publisher')
  }
  synopsis = new (ledgerPublisher.Synopsis)()
  const stateSynopsis = ledgerState.getSynopsis(state)

  if (publisherInfo._internal.verboseP) {
    console.log('\nstarting up ledger publisher integration')
  }

  if (stateSynopsis.isEmpty()) {
    return initSynopsis(state)
  }

  try {
    synopsis = new (ledgerPublisher.Synopsis)(stateSynopsis)
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
  return !nextTime || (underscore.now() > nextTime)
}

const shouldShowNotificationAddFunds = () => {
  const nextTime = getSetting(settings.PAYMENTS_NOTIFICATION_ADD_FUNDS_TIMESTAMP)
  return !nextTime || (underscore.now() > nextTime)
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
  const nextTime = underscore.now() + (3 * miliseconds.day)
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
  } else if (reconcileStamp - underscore.now() < 2 * miliseconds.day) {
    if (sufficientBalanceToReconcile(state) && (shouldShowNotificationReviewPublishers())) {
      showNotificationReviewPublishers(underscore.now() + miliseconds.day)
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
  if ((!ruleset) || (underscore.isEqual(publisherInfo._internal.ruleset.raw, ruleset))) return

  try {
    let stewed = []
    ruleset.forEach((rule) => {
      let entry = { condition: acorn.parse(rule.condition) }

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
    if (!synopsis) {
      return
    }

    let syncP = false
    ledgerState.getPublishers(state).forEach((publisher, index) => {
      const location = (publisher.get('protocol') || 'http:') + '//' + index
      let ctx = urlParse(location, true)

      ctx.TLD = tldjs.getPublicSuffix(ctx.host)
      if (!ctx.TLD) return

      ctx = underscore.mapObject(ctx, function (value, key) { if (!underscore.isFunction(value)) return value })
      ctx.URL = location
      ctx.SLD = tldjs.getDomain(ctx.host)
      ctx.RLD = tldjs.getSubdomain(ctx.host)
      ctx.QLD = ctx.RLD ? underscore.last(ctx.RLD.split('.')) : ''

      stewed.forEach((rule) => {
        if ((rule.consequent !== null) || (rule.dom)) return
        if (!ruleSolver.resolve(rule.condition, ctx)) return

        if (publisherInfo._internal.verboseP) console.log('\npurging ' + index)
        delete synopsis.publishers[publisher]
        state = ledgerState.deletePublishers(state, index)
        syncP = true
      })
    })

    if (!syncP) {
      return
    }

    return updatePublisherInfo(state)
  } catch (ex) {
    console.error('ruleset error: ', ex)
    return state
  }
}

const clientprep = () => {
  if (!ledgerClient) ledgerClient = require('ledger-client')
  ledgerInfo._internal.debugP = ledgerClient.prototype.boolion(process.env.LEDGER_CLIENT_DEBUG)
  publisherInfo._internal.debugP = ledgerClient.prototype.boolion(process.env.LEDGER_PUBLISHER_DEBUG)
  publisherInfo._internal.verboseP = ledgerClient.prototype.boolion(process.env.LEDGER_PUBLISHER_VERBOSE)
}

const roundtrip = (params, options, callback) => {
  let parts = typeof params.server === 'string' ? urlParse(params.server)
    : typeof params.server !== 'undefined' ? params.server
      : typeof options.server === 'string' ? urlParse(options.server) : options.server
  const rawP = options.rawP

  if (!params.method) params.method = 'GET'
  parts = underscore.extend(underscore.pick(parts, [ 'protocol', 'hostname', 'port' ]),
    underscore.omit(params, [ 'headers', 'payload', 'timeout' ]))

// TBD: let the user configure this via preferences [MTR]
  if ((parts.hostname === 'ledger.brave.com') && (params.useProxy)) parts.hostname = 'ledger-proxy.privateinternetaccess.com'

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
    headers: underscore.defaults(params.headers || {}, { 'content-type': 'application/json; charset=utf-8' }),
    verboseP: options.verboseP
  }
  request.request(options, (err, response, body) => {
    let payload

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

const updateLedgerInfo = (state) => {
  const info = ledgerInfo._internal.paymentInfo
  const now = underscore.now()

  // TODO check if we can have internal info in the state already
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
        queryString.stringify({ currency: ledgerInfo.currency,
          amount: getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT),
          address: ledgerInfo.address })
      ledgerInfo.buyMaximumUSD = false
    }

    underscore.extend(ledgerInfo, ledgerInfo._internal.cache || {})
  }

  // TODO we don't need this for BAT
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

  if (ledgerInfo._internal.debugP) {
    console.log('\nupdateLedgerInfo: ' + JSON.stringify(underscore.omit(ledgerInfo, [ '_internal' ]), null, 2))
  }

  return ledgerState.mergeInfoProp(state, underscore.omit(ledgerInfo, [ '_internal' ]))
}

// Called from observeTransactions() when we see a new payment (transaction).
const showNotificationPaymentDone = (transactionContributionFiat) => {
  const notificationPaymentDoneMessage = locale.translation('notificationPaymentDone')
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
  if (underscore.isEqual(current, transactions)) {
    return
  }
  // Notify the user of new transactions.
  if (getSetting(settings.PAYMENTS_NOTIFICATIONS) && current !== null) {
    const newTransactions = underscore.difference(transactions, current)
    if (newTransactions.length > 0) {
      const newestTransaction = newTransactions[newTransactions.length - 1]
      showNotificationPaymentDone(newestTransaction.contribution.fiat)
    }
  }
}

const getStateInfo = (state, parsedData) => {
  const info = parsedData.paymentInfo
  const then = underscore.now() - miliseconds.year

  if (!parsedData.properties.wallet) {
    return
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
    ledgerInfo._internal.paymentInfo = info // TODO check if we can just save this into the state
    const paymentURL = 'bitcoin:' + info.address + '?amount=' + info.btc + '&label=' + encodeURI('Brave Software')
    const oldUrl = ledgerState.getInfoProp(state, 'paymentURL')
    if (oldUrl !== paymentURL) {
      state = ledgerState.setInfoProp(state, 'paymentURL', paymentURL)
      try {
        let chunks = []
        qr.image(paymentURL, { type: 'png' })
          .on('data', (chunk) => { chunks.push(chunk) })
          .on('end', () => {
            const paymentIMG = 'data:image/png;base64,' + Buffer.concat(chunks).toString('base64')
            state = ledgerState.setInfoProp(state, 'paymentIMG', paymentIMG)
          })
      } catch (ex) {
        console.error('qr.imageSync error: ' + ex.toString())
      }
    }
  }

  let transactions = []
  if (!parsedData.transactions) {
    return updateLedgerInfo(state)
  }

  for (let i = parsedData.transactions.length - 1; i >= 0; i--) {
    let transaction = parsedData.transactions[i]
    if (transaction.stamp < then) break

    if ((!transaction.ballots) || (transaction.ballots.length < transaction.count)) continue

    let ballots = underscore.clone(transaction.ballots || {})
    parsedData.ballots.forEach((ballot) => {
      if (ballot.viewingId !== transaction.viewingId) return

      if (!ballots[ballot.publisher]) ballots[ballot.publisher] = 0
      ballots[ballot.publisher]++
    })

    transactions.push(underscore.extend(underscore.pick(transaction,
      [ 'viewingId', 'contribution', 'submissionStamp', 'count' ]),
      { ballots: ballots }))
  }

  observeTransactions(state, transactions)
  state = ledgerState.setInfoProp(state, 'transactions', transactions)
  return updateLedgerInfo(state)
}

// TODO refactor when action is added
/*
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
    console.error('properties error: ' + ex.toString())
  }
}
*/

const setPaymentInfo = (amount) => {
  var bravery

  if (!client) return

  try {
    bravery = client.getBraveryProperties()
  } catch (ex) {
    // wallet being created...
    return setTimeout(function () { setPaymentInfo(amount) }, 2 * miliseconds.second)
  }

  amount = parseInt(amount, 10)
  if (isNaN(amount) || (amount <= 0)) return

  underscore.extend(bravery.fee, { amount: amount })
  client.setBraveryProperties(bravery, (err, result) => {
    if (ledgerInfo.created) {
      // getPaymentInfo() TODO create action for this
    }

    if (err) return console.error('ledger setBraveryProperties: ' + err.toString())

    if (result) {
      muonWriter(pathName(statePath), result)
      // TODO save this new data to appState
    }
  })
}

let balanceTimeoutId = false
const getBalance = (state) => {
  if (!client) return

  balanceTimeoutId = setTimeout(getBalance, 1 * miliseconds.minute)
  if (!ledgerState.getInfoProp(state, 'address')) {
    return
  }

  if (!ledgerBalance) ledgerBalance = require('ledger-balance')
  ledgerBalance.getBalance(ledgerInfo.address, underscore.extend({ balancesP: true }, client.options),
    (err, provider, result) => {
      // TODO create action to handle callback
      if (err) {
        return console.warn('ledger balance warning: ' + JSON.stringify(err, null, 2))
      }
      /*
      var unconfirmed
      var info = ledgerInfo._internal.paymentInfo

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
      */
    })
}

// TODO
const callback = (err, result, delayTime) => {
  /*
  var results
  var entries = client && client.report()

  if (clientOptions.verboseP) {
    console.log('\nledger client callback: clientP=' + (!!client) + ' errP=' + (!!err) + ' resultP=' + (!!result) +
      ' delayTime=' + delayTime)
  }

  if (err) {
    console.log('ledger client error(1): ' + JSON.stringify(err, null, 2) + (err.stack ? ('\n' + err.stack) : ''))
    if (!client) return

    if (typeof delayTime === 'undefined') delayTime = random.randomInt({ min: miliseconds.minute, max: 10 * miliseconds.minute })
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
      if (err) return console.error(v2RulesetPath + ' error: ' + JSON.stringify(err, null, 2))

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
      if (err) return console.error(v2PublishersPath + ' error: ' + JSON.stringify(err, null, 2))
    })
  }

  muonWriter(pathName(statePath), result)
  run(delayTime)
  */
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
    return
  }

  if (!ledgerPublisher) ledgerPublisher = require('ledger-publisher')
  let ruleset = []
  ledgerPublisher.ruleset.forEach(rule => { if (rule.consequent) ruleset.push(rule) })
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
        underscore.extend(parsedData.options, { roundtrip: roundtrip }, clientOptions),
        parsedData)

      // Scenario: User enables Payments, disables it, waits 30+ days, then
      // enables it again -> reconcileStamp is in the past.
      // In this case reset reconcileStamp to the future.
      try { timeUntilReconcile = client.timeUntilReconcile() } catch (ex) {}
      let ledgerWindow = (ledgerState.getSynopsisOption(state, 'numFrames') - 1) * ledgerState.getSynopsisOption(state, 'frameSize')
      if (typeof timeUntilReconcile === 'number' && timeUntilReconcile < -ledgerWindow) {
        client.setTimeUntilReconcile(null, (err, stateResult) => {
          if (err) return console.error('ledger setTimeUntilReconcile error: ' + err.toString())

          if (!stateResult) {
            return
          }
          state = getStateInfo(stateResult)

          muonWriter(pathName(statePath), stateResult)
        })
      }
    } catch (ex) {
      return console.error('ledger client creation error: ', ex)
    }

    // speed-up browser start-up by delaying the first synchronization action
    // TODO create new action that is triggered after 3s
    /*
    setTimeout(() => {
      if (!client) return

      if (client.sync(callback) === true) run(random.randomInt({ min: miliseconds.minute, max: 10 * miliseconds.minute }))
      state = cacheRuleSet(state, parsedData.ruleset)
    }, 3 * miliseconds.second)
    */

    // Make sure bravery props are up-to-date with user settings
    const address = ledgerState.getInfoProp(state, 'address')
    if (!address) {
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

const init = (state) => {
  try {
    state = initialize(state, getSetting(settings.PAYMENTS_ENABLED))
  } catch (ex) {
    console.error('ledger.js initialization failed: ', ex)
  }

  return state
}

// TODO rename
const contributeP = (state, publisherKey) => {
  const publisher = ledgerState.getPublisher(state, publisherKey)
  return (
    (stickyP(state, publisherKey) || publisher.getIn(['options', 'exclude']) !== true) &&
    eligibleP(state, publisherKey) &&
    !blockedP(state, publisherKey)
  )
}

const run = (delayTime) => {
  // TODO implement
  /*
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
    if (state) muonWriter(pathName(statePath), state)
  } catch (ex) {
    console.log('ledger client error(2): ' + ex.toString() + (ex.stack ? ('\n' + ex.stack) : ''))
  }

  if (delayTime === 0) {
    try {
      delayTime = client.timeUntilReconcile()
    } catch (ex) {
      delayTime = false
    }
    if (delayTime === false) delayTime = random.randomInt({ min: miliseconds.minute, max: 10 * miliseconds.minute })
  }
  if (delayTime > 0) {
    if (runTimeoutId) return

    active = client
    if (delayTime > (1 * miliseconds.hour)) delayTime = random.randomInt({ min: 3 * miliseconds.minute, max: miliseconds.hour })

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
  */
}

const networkConnected = (state) => {
  // TODO pass state into debounced function
  underscore.debounce((state) => {
    if (!client) return

    if (runTimeoutId) {
      clearTimeout(runTimeoutId)
      runTimeoutId = false
    }
    if (client.sync(callback) === true) {
      // TODO refactor
      const delayTime = random.randomInt({ min: miliseconds.minute, max: 10 * miliseconds.minute })
      run(state, delayTime)
    }

    if (balanceTimeoutId) clearTimeout(balanceTimeoutId)
    balanceTimeoutId = setTimeout(getBalance, 5 * miliseconds.second)
  }, 1 * miliseconds.minute, true)
}

// TODO check if quitP is needed, now is defined in ledgerUtil.quit
const muonWriter = (path, payload) => {
  muon.file.writeImportant(path, JSON.stringify(payload, null, 2), (success) => {
    if (!success) return console.error('write error: ' + path)

    if ((quitP) && (!getSetting(settings.PAYMENTS_ENABLED)) && (getSetting(settings.SHUTDOWN_CLEAR_HISTORY))) {
      if (ledgerInfo._internal.debugP) {
        console.log('\ndeleting ' + path)
      }

      const fs = require('fs')
      return fs.unlink(path, (err) => { if (err) console.error('unlink error: ' + err.toString()) })
    }

    if (ledgerInfo._internal.debugP) console.log('\nwrote ' + path)
  })
}

module.exports = {
  synopsis,
  shouldTrackView,
  btcToCurrencyString,
  formattedTimeFromNow,
  formattedDateFromTimestamp,
  walletStatus,
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
  verifiedP
}
