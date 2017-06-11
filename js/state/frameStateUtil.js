/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Constants
const config = require('../constants/config')
const settings = require('../constants/settings')

// Actions
const windowActions = require('../actions/windowActions')
const webviewActions = require('../actions/webviewActions')
const appActions = require('../actions/appActions')

// State
const {makeImmutable} = require('../../app/common/state/immutableUtil')

// Utils
const {getSetting} = require('../settings')
const {isIntermediateAboutPage} = require('../lib/appUrlUtil')
const urlParse = require('../../app/common/urlParse')

const comparatorByKeyAsc = (a, b) => a.get('key') > b.get('key')
  ? 1 : b.get('key') > a.get('key') ? -1 : 0

const matchFrame = (queryInfo, frame) => {
  queryInfo = queryInfo.toJS ? queryInfo.toJS() : queryInfo
  return !Object.keys(queryInfo).map((queryKey) => (frame.get(queryKey) === queryInfo[queryKey])).includes(false)
}

function query (state, queryInfo) {
  return state.get('frames').filter(matchFrame.bind(null, queryInfo))
}

function find (state, queryInfo) {
  return state.get('frames').find(matchFrame.bind(null, queryInfo))
}

function isFrameKeyActive (state, frameKey) {
  return getActiveFrameKey(state) === frameKey
}

function getFrames (state) {
  return state.get('frames')
}

function getSortedFrames (state) {
  return state.get('frames').sort(comparatorByKeyAsc)
}

function getPinnedFrames (state) {
  return state.get('frames').filter((frame) => frame.get('pinnedLocation'))
}

function getNonPinnedFrames (state) {
  return state.get('frames').filter((frame) => !frame.get('pinnedLocation'))
}

function getFrameIndex (state, key) {
  return getFramesInternalIndex(state, key)
}

function getActiveFrameIndex (state) {
  return getFrameIndex(state, getActiveFrameKey(state))
}

function getActiveFrameTabId (state) {
  const activeFrame = getActiveFrame(state)
  return activeFrame && activeFrame.get('tabId')
}

function getFrameByIndex (state, i) {
  if (i === -1) {
    return null
  }
  return state.getIn(['frames', i])
}

// This will eventually go away fully when we replace frameKey by tabId
function getFrameKeyByTabId (state, tabId) {
  let parentFrameKey = null
  const openerFrame = getFrameByTabId(state, tabId)
  if (openerFrame) {
    parentFrameKey = openerFrame.get('key')
  }
  return parentFrameKey
}

function getFrameKeysByDisplayIndex (state) {
  const frames = state.get('frames')
  let framesByDisplayIndex = [[], []]
  frames.forEach((frame) => {
    let key = frame.get('key')
    if (frame.get('pinnedLocation')) {
      framesByDisplayIndex[0].push(key)
    } else {
      framesByDisplayIndex[1].push(key)
    }
  })
  return framesByDisplayIndex.reduce(function (a, b) {
    return a.concat(b)
  }, [])
}

function getFrameKeysByNonPinnedDisplayIndex (state) {
  return state.get('frames')
    .filter((frame) => !frame.get('pinnedLocation'))
    .map((frame) => frame.get('key'))
}

 /**
 * Obtains the display index for the specified frame key excluding pins
 */
function findNonPinnedDisplayIndexForFrameKey (state, key) {
  return getFrameKeysByNonPinnedDisplayIndex(state)
    .findIndex((displayKey) => displayKey === key)
}

function getFrameByDisplayIndex (state, i) {
  let frames = getFrameKeysByDisplayIndex(state)
  let key = frames[i]
  return getFrameByKey(state, key)
}

function getFrameByKey (state, key) {
  const index = getFrameIndex(state, key)
  if (index === -1) {
    return null
  }
  return state.getIn(['frames', index])
}

function isFrameSecure (frame) {
  frame = makeImmutable(frame)
  if (frame && typeof frame.getIn(['security', 'isSecure']) === 'boolean') {
    return frame.getIn(['security', 'isSecure'])
  } else {
    return false
  }
}

function isFrameLoading (frame) {
  frame = makeImmutable(frame)
  return frame && frame.get('loading')
}

function startLoadTime (frame) {
  frame = makeImmutable(frame)
  return frame && frame.get('startLoadTime')
}

function endLoadTime (frame) {
  frame = makeImmutable(frame)
  return frame && frame.get('endLoadTime')
}

function getHistory (frame) {
  frame = makeImmutable(frame)
  return (frame && frame.get('history')) || Immutable.fromJS([])
}

function isFrameKeyPinned (state, key) {
  if (typeof key !== 'number') {
    return false
  }
  const frame = getFrameByKey(state, key)
  return frame ? frame.get('pinnedLocation') : false
}

function getNonPinnedFrameCount (state) {
  return state.get('frames').filter((frame) => !frame.get('pinnedLocation')).size
}

function getFrameByTabId (state, tabId) {
  return getFrameByIndex(state, getFramesInternalIndexByTabId(state, tabId))
}

function getIndexByTabId (state, tabId) {
  return getFramesInternalIndexByTabId(state, tabId)
}

function getActiveFrame (state) {
  const activeFrameIndex = getActiveFrameIndex(state)
  return state.get('frames').get(activeFrameIndex)
}

// Returns the same as the active frame's location, but returns the requested
// URL if it's safe browsing, a cert error page or an error page.
function getLastCommittedURL (frame) {
  frame = makeImmutable(frame)
  if (!frame) {
    return undefined
  }

  let location = frame.get('location')
  const history = getHistory(frame)
  if (isIntermediateAboutPage(location)) {
    const parsedUrl = urlParse(location)
    if (parsedUrl.hash) {
      location = parsedUrl.hash.split('#')[1]
    } else if (history.size > 0) {
      location = history.last()
    }
  }
  return location
}

function getActiveFrameKey (state) {
  return state.get('activeFrameKey')
}

function getNextFrame (state) {
  const activeFrameIndex = findDisplayIndexForFrameKey(state, getActiveFrameKey(state))
  const index = (activeFrameIndex + 1) % state.get('frames').size
  return getFrameByDisplayIndex(state, index)
}

function getPreviousFrame (state) {
  const activeFrameIndex = findDisplayIndexForFrameKey(state, getActiveFrameKey(state))
  const index = (state.get('frames').size + activeFrameIndex - 1) % state.get('frames').size
  return getFrameByDisplayIndex(state, index)
}

/**
 * Obtains the display index for the specified frame key
 */
function findDisplayIndexForFrameKey (state, key) {
  return getFrameKeysByDisplayIndex(state).findIndex((displayKey) => displayKey === key)
}

/**
 * Determines if the specified frame was opened from the specified
 * ancestorFrameKey.
 *
 * For example you may go to google.com and open 3 links in new tabs:
 * G g1 g2 g3
 * Then you may change to g1 and open another tab:
 * G g1 g1.1 g2 g3
 * But then you may go back to google.com and open another tab.
 * It should go like so:
 * G g1 g1.1 g2 g3 g4
 */
function isAncestorFrameKey (state, frame, parentFrameKey) {
  if (!frame || !frame.get('parentFrameKey')) {
    return false
  }

  if (frame.get('parentFrameKey') === parentFrameKey) {
    return true
  }

  // So there is a parentFrameKey but it isn't the specified one.
  // Check recursively for each of the parentFrame's ancestors to see
  // if we have a match.
  const parentFrameIndex = getFrameIndex(state, frame.get('parentFrameKey'))
  const parentFrame = state.getIn(['frames', parentFrameIndex])
  if (parentFrameIndex === -1 || !parentFrame.get('parentFrameKey')) {
    return false
  }
  return isAncestorFrameKey(state, parentFrame, parentFrameKey)
}

function getPartitionNumber (partition) {
  const regex = /(?:persist:)?partition-(\d+)/
  const matches = regex.exec(partition)
  return Number((matches && matches[1]) || 0)
}

function isPrivatePartition (partition) {
  return partition && !partition.startsWith('persist:')
}

function isSessionPartition (partition) {
  return partition && partition.startsWith('persist:partition-')
}

function getPartition (frameOpts) {
  return getPartitionFromNumber(frameOpts.get('partitionNumber'), frameOpts.get('isPrivate'))
}

function getPartitionFromNumber (partitionNumber, incognito) {
  if (!partitionNumber && !incognito) {
    return 'persist:default'
  } else if (incognito) {
    return 'default'
  }
  return `persist:partition-${partitionNumber}`
}

const frameOptsFromFrame = (frame) => {
  return frame
    .delete('key')
    .delete('parentFrameKey')
    .delete('activeShortcut')
    .delete('activeShortcutDetails')
    .delete('index')
    .deleteIn(['navbar', 'urlbar', 'suggestions'])
}

/**
 * Adds a frame specified by frameOpts and newKey and sets the activeFrameKey
 * @return Immutable top level application state ready to merge back in
 */
function addFrame (state, frameOpts, newKey, partitionNumber, openInForeground, insertionIndex) {
  const frames = state.get('frames')

  const location = frameOpts.location // page url
  const displayURL = frameOpts.displayURL == null ? location : frameOpts.displayURL
  delete frameOpts.displayURL

  const rendererInitiated = frameOpts.rendererInitiated
  delete frameOpts.rendererInitiated

  // Only add pin requests if it's not already added
  const isPinned = frameOpts.isPinned
  delete frameOpts.isPinned

  // TODO: longer term get rid of parentFrameKey completely instead of
  // calculating it here.
  let parentFrameKey = frameOpts.parentFrameKey
  if (frameOpts.openerTabId) {
    parentFrameKey = getFrameKeyByTabId(state, frameOpts.openerTabId)
  }

  const frame = Immutable.fromJS(Object.assign({
    zoomLevel: config.zoom.defaultValue,
    audioMuted: false, // frame is muted
    location,
    aboutDetails: undefined,
    src: location, // what the iframe src should be
    tabId: frameOpts.tabId == null ? -1 : frameOpts.tabId,
    loading: frameOpts.rendererInitiated,
    startLoadTime: null,
    endLoadTime: null,
    lastAccessedTime: openInForeground ? new Date().getTime() : null,
    isPrivate: false,
    partitionNumber,
    pinnedLocation: isPinned ? location : undefined,
    key: newKey,
    navbar: {
      urlbar: {
        location: rendererInitiated ? location : displayURL,
        suggestions: {
          selectedIndex: 0,
          searchResults: [],
          suggestionList: null
        },
        selected: false,
        // URL load-start will focus the webview if it's not newtab.
        focused: true,
        active: false
      }
    },
    searchDetail: null,
    findDetail: {
      searchString: '',
      caseSensitivity: false
    },
    security: {
      isSecure: null
    },
    unloaded: frameOpts.unloaded,
    parentFrameKey,
    history: []
  }, frameOpts))

  return {
    frames: frames.splice(insertionIndex, 0, frame)
  }
}

/**
 * Removes a frame specified by frameProps
 * @return Immutable top level application state ready to merge back in
 */
function removeFrame (state, frameProps, framePropsIndex) {
  const frames = state.get('frames')
  let closedFrames = state.get('closedFrames')
  const newFrames = frames.splice(framePropsIndex, 1)

  if (isValidClosedFrame(frameProps)) {
    frameProps = frameProps.set('isFullScreen', false)
    closedFrames = closedFrames.push(frameProps)
    if (frameProps.get('thumbnailBlob')) {
      window.URL.revokeObjectURL(frameProps.get('thumbnailBlob'))
    }
    if (closedFrames.size > config.maxClosedFrames) {
      closedFrames = closedFrames.shift()
    }
  }

  return {
    previewFrameKey: null,
    closedFrames,
    frames: newFrames
  }
}

function getFrameTabPageIndex (state, frameProps, tabsPerTabPage) {
  frameProps = makeImmutable(frameProps)
  const index = findNonPinnedDisplayIndexForFrameKey(state, frameProps.get('key'))
  if (index === -1) {
    return -1
  }
  return Math.floor(index / tabsPerTabPage)
}

function onFindBarHide (frameKey) {
  windowActions.setFindbarShown(frameKey, false)
  webviewActions.stopFindInPage()
  windowActions.setFindDetail(frameKey, Immutable.fromJS({
    internalFindStatePresent: false,
    numberOfMatches: -1,
    activeMatchOrdinal: 0
  }))
}

function getTotalBlocks (frame) {
  if (!frame) {
    return false
  }

  frame = makeImmutable(frame)

  const ads = frame.getIn(['adblock', 'blocked'])
  const trackers = frame.getIn(['trackingProtection', 'blocked'])
  const scripts = frame.getIn(['noScript', 'blocked'])
  const fingerprint = frame.getIn(['fingerprintingProtection', 'blocked'])
  const blocked = (ads && ads.size ? ads.size : 0) +
    (trackers && trackers.size ? trackers.size : 0) +
    (scripts && scripts.size ? scripts.size : 0) +
    (fingerprint && fingerprint.size ? fingerprint.size : 0)

  return (blocked === 0)
    ? false
    : ((blocked > 99) ? '99+' : blocked)
}

/**
 * Check if frame is pinned or not
 */
function isPinned (state, frameKey) {
  const frame = getFrameByKey(state, frameKey)

  return !!frame.get('pinnedLocation')
}

/**
 * Updates the tab page index to the specified frameProps
 * @param frameProps Any frame belonging to the page
 */
function updateTabPageIndex (state, frameProps) {
  const index = getFrameTabPageIndex(state, frameProps, getSetting(settings.TABS_PER_PAGE))

  if (index === -1) {
    return state
  }

  state = state.setIn(['ui', 'tabs', 'tabPageIndex'], index)
  state = state.deleteIn(['ui', 'tabs', 'previewTabPageIndex'])

  return state
}

const frameStatePath = (state, frameKey) => {
  const index = getFrameIndex(state, frameKey)
  if (index === -1) {
    return null
  }
  return ['frames', getFrameIndex(state, frameKey)]
}

const activeFrameStatePath = (state) => frameStatePath(state, getActiveFrameKey(state))

const getFramesInternalIndex = (state, frameKey) => {
  if (frameKey == null) return -1

  const index = state.getIn(['framesInternal', 'index', frameKey.toString()])
  return index == null ? -1 : index
}

const getFramesInternalIndexByTabId = (state, tabId) => {
  if (tabId == null) return -1

  const index = state.getIn(['framesInternal', 'tabIndex', tabId.toString()])
  return index == null ? -1 : index
}

const deleteTabInternalIndex = (state, tabId) => {
  return state.deleteIn(['framesInternal', 'tabIndex', tabId.toString()])
}

const deleteFrameInternalIndex = (state, frame) => {
  if (!frame) {
    return state
  }

  state = state.deleteIn(['framesInternal', 'index', frame.get('key').toString()])
  return deleteTabInternalIndex(state, frame.get('tabId'))
}

const updateFramesInternalIndex = (state, fromIndex) => {
  let framesInternal = state.get('framesInternal') || Immutable.Map()
  state.get('frames').slice(fromIndex).forEach((frame, idx) => {
    const realIndex = idx + fromIndex
    if (frame.get('key')) {
      framesInternal = framesInternal.setIn(['index', frame.get('key').toString()], realIndex)
    }
    if (frame.get('tabId') !== -1) {
      framesInternal = framesInternal.setIn(['tabIndex', frame.get('tabId').toString()], realIndex)
    }

    appActions.tabIndexChanged(frame.get('tabId'), realIndex)
  })

  return state.set('framesInternal', framesInternal)
}

const isValidClosedFrame = (frame) => {
  const location = frame.get('location')
  if (location && (location.indexOf('about:newtab') !== -1 || location.indexOf('about:blank') !== -1)) {
    return false
  }
  return !frame.get('isPrivate')
}

const getTabPageCount = (state) => {
  const frames = getNonPinnedFrames(state) || Immutable.List()
  const tabsPerPage = Number(getSetting(settings.TABS_PER_PAGE))

  return Math.ceil(frames.size / tabsPerPage)
}

module.exports = {
  deleteTabInternalIndex,
  deleteFrameInternalIndex,
  updateFramesInternalIndex,
  query,
  find,
  isAncestorFrameKey,
  isFrameKeyActive,
  isFrameSecure,
  isFrameLoading,
  startLoadTime,
  endLoadTime,
  getHistory,
  isFrameKeyPinned,
  getNonPinnedFrameCount,
  isPrivatePartition,
  isSessionPartition,
  getFrames,
  getSortedFrames,
  getPinnedFrames,
  getNonPinnedFrames,
  getFrameIndex,
  getActiveFrameIndex,
  getActiveFrameTabId,
  getFrameByIndex,
  getFrameByDisplayIndex,
  getFrameByKey,
  getFrameByTabId,
  getIndexByTabId,
  getPartitionNumber,
  getActiveFrame,
  getNextFrame,
  getPreviousFrame,
  findDisplayIndexForFrameKey,
  getFrameKeysByDisplayIndex,
  getPartition,
  getPartitionFromNumber,
  addFrame,
  removeFrame,
  frameOptsFromFrame,
  getFrameKeyByTabId,
  getFrameTabPageIndex,
  frameStatePath,
  activeFrameStatePath,
  getLastCommittedURL,
  onFindBarHide,
  getTotalBlocks,
  isPinned,
  updateTabPageIndex,
  isValidClosedFrame,
  getTabPageCount
}
