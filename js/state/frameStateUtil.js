/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Constants
const config = require('../constants/config')
const appConfig = require('../constants/appConfig')
const settings = require('../constants/settings')

// Actions
const windowActions = require('../actions/windowActions')
const tabActions = require('../../app/common/actions/tabActions')

// State
const {makeImmutable} = require('../../app/common/state/immutableUtil')
const tabState = require('../../app/common/state/tabState')

// Utils
const {getSetting} = require('../settings')
const {isIntermediateAboutPage} = require('../lib/appUrlUtil')
const urlParse = require('../../app/common/urlParse')

let tabPageHoverTimeout
let tabHoverTimeout = null

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

function getFrameKeys (state) {
  return state.get('frames', Immutable.List()).map(frame => frame.get('key'))
}

function getSortedFrames (state) {
  return state.get('frames', Immutable.List()).sort(comparatorByKeyAsc)
}

function getSortedFrameKeys (state) {
  return getSortedFrames(state)
    .map(frame => frame.get('key'))
}

function getPinnedFrames (state) {
  return state.get('frames', Immutable.List()).filter((frame) => frame.get('pinnedLocation'))
}

function getNonPinnedFrames (state) {
  return state.get('frames', Immutable.List()).filter((frame) => !frame.get('pinnedLocation'))
}

function getFrameIndex (state, frameKey) {
  if (frameKey == null) return -1

  const index = state.getIn(['framesInternal', 'index', frameKey.toString()])
  return index == null ? -1 : index
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

function getTabIdsByNonPinnedDisplayIndex (state) {
  return state.get('frames')
    .filter((frame) => !frame.get('pinnedLocation'))
    .map((frame) => frame.get('tabId'))
}

/**
* Obtains the display index for the specified tab ID excluding pins
*/
function findNonPinnedDisplayIndexForTabId (state, tabId) {
  return getTabIdsByNonPinnedDisplayIndex(state)
    .findIndex((displayKey) => displayKey === tabId)
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
  return getFrameByIndex(state, getIndexByTabId(state, tabId))
}

function getIndexByTabId (state, tabId) {
  if (tabId == null) return -1

  const index = state.getIn(['framesInternal', 'tabIndex', tabId.toString()])
  return index == null ? -1 : index
}

const getTabIdByFrameKey = (state, frameKey) => {
  const frame = getFrameByKey(state, frameKey)
  return frame && frame.get('tabId', tabState.TAB_ID_NONE)
}

function getActiveFrame (state) {
  const activeFrameIndex = getActiveFrameIndex(state)
  const frames = state.get('frames')
  return frames ? frames.get(activeFrameIndex) : null
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

const setActiveFrameKey = (state, frameKey) => {
  return state.set('activeFrameKey', frameKey)
}

const setFrameLastAccessedTime = (state, index) => {
  return state.setIn(['frames', index, 'lastAccessedTime'], new Date().getTime())
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
    .delete('index')
    .deleteIn(['navbar', 'urlbar', 'suggestions'])
}

/**
* Adds a frame specified by frameOpts and newKey and sets the activeFrameKey
* @return Immutable top level application state ready to merge back in
*/
function addFrame (state, frameOpts, newKey, partitionNumber, openInForeground, insertionIndex) {
  const frames = state.get('frames', Immutable.List())

  const location = frameOpts.location // page url
  const displayURL = frameOpts.displayURL == null ? location : frameOpts.displayURL
  delete frameOpts.displayURL

  const rendererInitiated = frameOpts.rendererInitiated
  delete frameOpts.rendererInitiated

  // Only add pin requests if it's not already added
  const isPinned = frameOpts.isPinned
  delete frameOpts.isPinned

  delete frameOpts.index

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
  let closedFrames = state.get('closedFrames') || Immutable.List()
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
    closedFrames,
    frames: newFrames
  }
}

function getFrameTabPageIndex (state, tabId, tabsPerTabPage = getSetting(settings.TABS_PER_PAGE)) {
  const index = findNonPinnedDisplayIndexForTabId(state, tabId)
  if (index === -1) {
    return -1
  }
  return Math.floor(index / tabsPerTabPage)
}

function onFindBarHide (frameKey, tabId) {
  windowActions.setFindbarShown(frameKey, false)
  tabActions.stopFindInPageRequest(tabId)
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

  return frame && !!frame.get('pinnedLocation')
}

const isFirstFrameKeyInTabPage = (state, frameKey) => {
  const pageIndex = getTabPageIndex(state)
  const tabsPerTabPage = Number(getSetting(settings.TABS_PER_PAGE))
  const startingFrameIndex = pageIndex * tabsPerTabPage
  const unpinnedTabs = getNonPinnedFrames(state) || Immutable.List()
  const firstFrame = unpinnedTabs
    .slice(startingFrameIndex, startingFrameIndex + tabsPerTabPage).first()

  return firstFrame && firstFrame.get('key') === frameKey
}

/**
 * Check if frame or tab object is associated with a tor private tab
 */
function isTor (frame) {
  return !!(frame && frame.get('partition') === appConfig.tor.partition)
}

const getTabPageIndex = (state) => {
  const tabPageIndex = state.getIn(['ui', 'tabs', 'tabPageIndex'], 0)
  const previewTabPageIndex = state.getIn(['ui', 'tabs', 'previewTabPageIndex'])

  return previewTabPageIndex != null ? previewTabPageIndex : tabPageIndex
}

/**
* Updates the tab page index to the specified frameProps
* @param state{Object} - Window state
* @param tabId{number} - Tab id for the frame
* @param tabsPerPage{string} - Current setting for tabs per page, with a default value
*/
function updateTabPageIndex (state, tabId, tabsPerPage = getSetting(settings.TABS_PER_PAGE)) {
  const index = getFrameTabPageIndex(state, tabId, tabsPerPage)

  if (index === -1) {
    return state
  }

  return state.setIn(['ui', 'tabs', 'tabPageIndex'], index)
}
const frameStatePath = (state, frameKey) => {
  const index = getFrameIndex(state, frameKey)
  if (index === -1) {
    return null
  }
  return ['frames', index]
}

const frameStatePathByTabId = (state, tabId) => {
  const index = getIndexByTabId(state, tabId)
  if (index === -1) {
    return null
  }
  return ['frames', index]
}

const activeFrameStatePath = (state) => frameStatePath(state, getActiveFrameKey(state))

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
  state.get('frames').slice(fromIndex).reduceRight((result, frame, idx) => {
    const tabId = frame.get('tabId')
    const frameKey = frame.get('key')
    const realIndex = idx + fromIndex
    if (frameKey) {
      framesInternal = framesInternal.setIn(['index', frameKey.toString()], realIndex)
    }
    if (tabId != null && tabId !== -1) {
      framesInternal = framesInternal.setIn(['tabIndex', tabId.toString()], realIndex)
    }
  }, 0)
  return state.set('framesInternal', framesInternal)
}

const moveFrame = (state, tabId, index) => {
  let framesInternal = state.get('framesInternal') || Immutable.Map()
  const frame = getFrameByTabId(state, tabId)
  const frameKey = frame.get('key')
  if (frameKey) {
    framesInternal = framesInternal.setIn(['index', frameKey.toString()], index)
  }
  if (tabId != null && tabId !== -1) {
    framesInternal = framesInternal.setIn(['tabIndex', tabId.toString()], index)
  }
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

const getPreviewFrameKey = (state) => {
  return state.get('previewFrameKey')
}

const setPreviewTabPageIndex = (state, index, immediate = false) => {
  clearTimeout(tabPageHoverTimeout)
  const previewTabs = getSetting(settings.SHOW_TAB_PREVIEWS)
  const isActive = state.getIn(['ui', 'tabs', 'tabPageIndex']) === index
  let newTabPageIndex = index

  if (!previewTabs || state.getIn(['ui', 'tabs', 'hoverTabPageIndex']) !== index || isActive) {
    newTabPageIndex = null
  }

  if (!immediate) {
    // if there is an existing preview tab page index then we're already in preview mode
    // we use actions here because that is the only way to delay updating the state
    const previewMode = state.getIn(['ui', 'tabs', 'previewTabPageIndex']) != null
    if (previewMode && newTabPageIndex == null) {
      // add a small delay when we are clearing the preview frame key so we don't lose
      // previewMode if the user mouses over another tab - see below
      tabPageHoverTimeout = setTimeout(windowActions.setPreviewTabPageIndex.bind(null, null), 200)
      return state
    }

    if (!previewMode) {
      // If user isn't in previewMode so we add a bit of delay to avoid tab from flashing out
      // as reported here: https://github.com/brave/browser-laptop/issues/1434
      // using an action here because that is the only way we can do a delayed state update
      tabPageHoverTimeout = setTimeout(windowActions.setPreviewTabPageIndex.bind(null, newTabPageIndex), 200)
      return state
    }
  }

  return state.setIn(['ui', 'tabs', 'previewTabPageIndex'], newTabPageIndex)
}

/**
* Defines whether or not a tab should be allowed to preview its content
* based on mouse idle time defined by mouse move in tab.js
* @param state {Object} - Application state
* @param previewMode {Boolean} - Whether or not minimium idle time
* has match the criteria
*/
const setPreviewMode = (state, previewMode) => {
  return state.setIn(['ui', 'tabs', 'previewMode'], previewMode)
}

/**
* Gets the previewMode application state
* @param state {Object} - Application state
* @return Immutable top level application state for previewMode
*/
const getPreviewMode = (state) => {
  return state.getIn(['ui', 'tabs', 'previewMode'])
}

const setPreviewFrameKey = (state, frameKey) => {
  clearTimeout(tabHoverTimeout)
  const frame = getFrameByKey(state, frameKey)
  const isActive = isFrameKeyActive(state, frameKey)
  const previewTabs = getSetting(settings.SHOW_TAB_PREVIEWS)
  const hoverState = getTabHoverState(state, frameKey)
  const previewMode = getPreviewMode(state)
  let newPreviewFrameKey = frameKey

  if (!previewTabs || !previewMode || frame == null || !hoverState || isActive) {
    newPreviewFrameKey = null
  }

  // TODO: remove this method to a tabPageIndex-related one
  const index = frame ? getFrameTabPageIndex(state, frame.get('tabId')) : -1
  if (index !== -1) {
    if (index !== state.getIn(['ui', 'tabs', 'tabPageIndex'])) {
      state = state.setIn(['ui', 'tabs', 'previewTabPageIndex'], index)
    } else {
      state = state.deleteIn(['ui', 'tabs', 'previewTabPageIndex'])
    }
  }
  return state.set('previewFrameKey', newPreviewFrameKey)
}

const setTabPageHoverState = (state, tabPageIndex, hoverState) => {
  const currentHoverIndex = state.getIn(['ui', 'tabs', 'hoverTabPageIndex'])
  if (!hoverState && currentHoverIndex === tabPageIndex) {
    state = state.setIn(['ui', 'tabs', 'hoverTabPageIndex'], null)
  } else if (hoverState) {
    state = state.setIn(['ui', 'tabs', 'hoverTabPageIndex'], tabPageIndex)
  }
  state = setPreviewTabPageIndex(state, tabPageIndex)
  return state
}

/**
* Checks if the current tab index is being hovered
* @param state {Object} - Application state
* @param frameKey {Number} - The current tab's frameKey
* @return Boolean - wheter or not hoverState is true
*/
const getTabHoverState = (state, frameKey) => {
  const index = getFrameIndex(state, frameKey)
  return getHoverTabIndex(state) === index
}

/**
* Gets the hovered tab index state
* This check will return null if no tab is being hovered
* and is used getTabHoverState to check if current index is being hovered.
* If the method to apply for does not know the right index
* this should be used instead of getTabHoverState
* @param state {Object} - Application state
* @return Immutable top level application state for hoverTabIndex
*/
const getHoverTabIndex = (state) => {
  return state.getIn(['ui', 'tabs', 'hoverTabIndex'])
}

/**
* Sets the hover state for current tab index in top level state
* @param state {Object} - Application state
* @param frameKey {Number} - The current tab's frameKey
* @param hoverState {Boolean} - True if the current tab is being hovered.
* @return Immutable top level application state for hoverTabIndex
*/
const setHoverTabIndex = (state, frameKey, hoverState) => {
  const frameIndex = getFrameIndex(state, frameKey)
  if (!hoverState) {
    state = state.setIn(['ui', 'tabs', 'hoverTabIndex'], null)
    return state
  }
  return state.setIn(['ui', 'tabs', 'hoverTabIndex'], frameIndex)
}

/**
* Gets values from the window setTabHoverState action from the store
* and is used to apply both hoverState and previewFrameKey
* @param state {Object} - Application state
* @param frameKey {Number} - The current tab's frameKey
* @param hoverState {Boolean} - True if the current tab is being hovered.
* @return Immutable top level application state for hoverTabIndex
*/
const setTabHoverState = (state, frameKey, hoverState, enablePreviewMode) => {
  const frameIndex = getFrameIndex(state, frameKey)
  if (frameIndex !== -1) {
    state = setHoverTabIndex(state, frameKey, hoverState)
    state = setPreviewMode(state, enablePreviewMode)
    state = setPreviewFrameKey(state, frameKey)
  }
  return state
}

const frameLocationMatch = (frame, location) => {
  if (frame == null) {
    return false
  }
  const validFrame = Immutable.Map.isMap(frame)
  return validFrame && frame.get('location') === location
}

const hasFrame = (state, frameKey) => {
  const frame = getFrameByKey(state, frameKey)
  return frame && !frame.isEmpty()
}

module.exports = {
  hasFrame,
  setTabPageHoverState,
  setPreviewTabPageIndex,
  getTabHoverState,
  setTabHoverState,
  setPreviewFrameKey,
  getPreviewFrameKey,
  deleteTabInternalIndex,
  deleteFrameInternalIndex,
  updateFramesInternalIndex,
  moveFrame,
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
  isSessionPartition,
  getFrames,
  getFrameKeys,
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
  getTabIdByFrameKey,
  getPartitionNumber,
  setFrameLastAccessedTime,
  setActiveFrameKey,
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
  isTor,
  isFirstFrameKeyInTabPage,
  getTabPageIndex,
  updateTabPageIndex,
  isValidClosedFrame,
  getTabPageCount,
  getSortedFrameKeys,
  frameStatePathByTabId,
  frameLocationMatch
}
