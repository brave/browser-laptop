/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const config = require('../constants/config')
const {tabCloseAction} = require('../../app/common/constants/settingsEnums')
const urlParse = require('../../app/common/urlParse')

const matchFrame = (queryInfo, frame) => {
  queryInfo = queryInfo.toJS ? queryInfo.toJS() : queryInfo
  return !Object.keys(queryInfo).map((queryKey) => (frame.get(queryKey) === queryInfo[queryKey])).includes(false)
}

function query (windowState, queryInfo) {
  return windowState.get('frames').filter(matchFrame.bind(null, queryInfo))
}

function find (windowState, queryInfo) {
  return windowState.get('frames').find(matchFrame.bind(null, queryInfo))
}

function isFrameKeyActive (windowState, frameKey) {
  return windowState.get('activeFrameKey') === frameKey
}

function getFrameDisplayIndex (windowState, frame) {
  return findDisplayIndexForFrameKey(windowState.get('frames'), frame)
}

function getFrameIndex (windowState, frame) {
  return findIndexForFrameKey(windowState.get('frames'), frame)
}

function getActiveFrameDisplayIndex (windowState) {
  return getFrameDisplayIndex(windowState, windowState.get('activeFrameKey'))
}

function getActiveFrameIndex (windowState) {
  return getFrameIndex(windowState, windowState.get('activeFrameKey'))
}

function getActiveFrameTabId (windowState) {
  const activeFrame = getActiveFrame(windowState)
  return activeFrame && activeFrame.get('tabId')
}

function getFrameByIndex (windowState, i) {
  return windowState.getIn(['frames', i])
}

// This will eventually go away fully when we replace frameKey by tabId
function getFrameKeyByTabId (windowState, tabId) {
  let parentFrameKey
  const openerFrame = getFrameByTabId(windowState, tabId)
  if (openerFrame) {
    parentFrameKey = openerFrame.get('key')
  }
  return parentFrameKey
}

function getFrameKeysByDisplayIndex (frames) {
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

function getFrameByDisplayIndex (windowState, i) {
  let frames = getFrameKeysByDisplayIndex(windowState.get('frames'))
  let key = frames[i]
  return getFrameByKey(windowState, key)
}

function getFrameByKey (windowState, key) {
  return find(windowState, {key})
}

function isFrameKeyPinned (frames, key) {
  if (typeof key !== 'number') {
    return false
  }
  const frame = frames.find(matchFrame.bind(null, {key}))
  return frame ? frame.get('pinnedLocation') : false
}

function getNonPinnedFrameCount (windowState) {
  return windowState.get('frames').filter((frame) => !frame.get('pinnedLocation')).size
}

function getFrameByTabId (windowState, tabId) {
  return find(windowState, {tabId})
}

function getActiveFrame (windowState) {
  const activeFrameIndex = getActiveFrameIndex(windowState)
  return windowState.get('frames').get(activeFrameIndex)
}

function setActiveFrameDisplayIndex (windowState, i) {
  const frame = getFrameByDisplayIndex(windowState, i)
  if (!frame) {
    return windowState
  }

  return setActiveFrameKey(windowState, frame.get('key'))
}

function setActiveFrameIndex (windowState, i) {
  const frame = getFrameByIndex(windowState, i)
  if (!frame) {
    return windowState
  }

  return setActiveFrameKey(windowState, frame.get('key'))
}

function setActiveFrameKey (windowState, activeFrameKey) {
  return windowState.merge({
    activeFrameKey: activeFrameKey,
    previewFrameKey: null
  })
}

function makeNextFrameActive (windowState) {
  const activeFrameIndex = getActiveFrameDisplayIndex(windowState)
  return setActiveFrameDisplayIndex(windowState, (activeFrameIndex + 1) % windowState.get('frames').size)
}

function makePrevFrameActive (windowState) {
  const activeFrameIndex = getActiveFrameDisplayIndex(windowState)
  return setActiveFrameDisplayIndex(windowState, (windowState.get('frames').size + activeFrameIndex - 1) % windowState.get('frames').size)
}

/**
 * @param {Object} windowState
 * @param {Object} frameProps
 * @param {String} propName
 * @return {Object} the value of the propName associated with frameProps
 */
function getFramePropValue (windowState, frameProps, propName) {
  return windowState.getIn(getFramePropPath(windowState, frameProps, propName))
}

/**
 * @param {Object} windowState
 * @param {Object} frameProps
 * @param {String} propName
 * @return {Object} the path of the propName in windowState
 */
function getFramePropPath (windowState, frameProps, propName) {
  return ['frames', getFramePropsIndex(windowState.get('frames'), frameProps), propName]
}

/**
 * Obtains the index for the specified frame key
 */
function findIndexForFrameKey (frames, key) {
  return frames.findIndex(matchFrame.bind(null, {key}))
}

/**
 * Obtains the display index for the specified frame key
 */
function findDisplayIndexForFrameKey (frames, key) {
  return getFrameKeysByDisplayIndex(frames).findIndex((displayKey) => displayKey === key)
}

/**
 * Obtains the frameProps index in the frames
 */
function getFramePropsIndex (frames, frameProps) {
  if (!frameProps) {
    return -1
  }
  let queryInfo = frameProps.toJS ? frameProps.toJS() : frameProps
  if (queryInfo.tabId) {
    queryInfo = {
      tabId: queryInfo.tabId
    }
  }
  if (queryInfo.key) {
    queryInfo = {
      key: queryInfo.key
    }
  }
  return frames.findIndex(matchFrame.bind(null, queryInfo))
}

/**
 * Find frame that was accessed last
 */
function getFrameByLastAccessedTime (frames) {
  const frameProps = frames.toJS()
    .reduce((pre, cur) => {
      return (cur.pinnedLocation === undefined &&
        cur.lastAccessedTime &&
        cur.lastAccessedTime > pre.lastAccessedTime
      ) ? cur : pre
    }, {
      lastAccessedTime: 0
    })

  return (frameProps.lastAccessedTime === 0) ? -1 : getFramePropsIndex(frames, frameProps)
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
function isAncestorFrameKey (frames, frame, parentFrameKey) {
  if (!frame || !frame.get('parentFrameKey')) {
    return false
  }

  if (frame.get('parentFrameKey') === parentFrameKey) {
    return true
  }

  // So there is a parentFrameKey but it isn't the specified one.
  // Check recursively for each of the parentFrame's ancestors to see
  // if we have a match.
  const parentFrameIndex = findIndexForFrameKey(frames, frame.get('parentFrameKey'))
  const parentFrame = frames.get(parentFrameIndex)
  if (parentFrameIndex === -1 || !parentFrame.get('parentFrameKey')) {
    return false
  }
  return isAncestorFrameKey(frames, parentFrame, parentFrameKey)
}

function getPartitionNumber (partition) {
  const regex = /(?:persist:)?partition-(\d+)/
  const matches = regex.exec(partition)
  return matches && matches[1]
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

/**
 * Returns an object in the same format that was passed to it (ImmutableJS/POD)
 * for the subset of frame data that is used for tabs.
 */
const tabFromFrame = (frame) => {
  return frame.toJS
  ? Immutable.fromJS({
    themeColor: frame.get('themeColor'),
    computedThemeColor: frame.get('computedThemeColor'),
    icon: frame.get('icon'),
    audioPlaybackActive: frame.get('audioPlaybackActive'),
    audioMuted: frame.get('audioMuted'),
    title: frame.get('title'),
    isPrivate: frame.get('isPrivate'),
    partitionNumber: frame.get('partitionNumber'),
    frameKey: frame.get('key'),
    loading: frame.get('loading'),
    provisionalLocation: frame.get('provisionalLocation'),
    pinnedLocation: frame.get('pinnedLocation'),
    location: frame.get('location')
  })
  : {
    themeColor: frame.themeColor,
    computedThemeColor: frame.computedThemeColor,
    icon: frame.icon,
    audioPlaybackActive: frame.audioPlaybackActive,
    audioMuted: frame.audioMuted,
    title: frame.title,
    isPrivate: frame.isPrivate,
    partitionNumber: frame.partitionNumber,
    frameKey: frame.key,
    loading: frame.loading,
    provisionalLocation: frame.provisionalLocation,
    pinnedLocation: frame.pinnedLocation,
    location: frame.location
  }
}

const frameOptsFromFrame = (frame) => {
  return frame
    .delete('tabId')
    .delete('key')
    .delete('parentFrameKey')
    .delete('activeShortcut')
    .delete('activeShortcutDetails')
}

/**
 * Adds a frame specified by frameOpts and newKey and sets the activeFrameKey
 * @return Immutable top level application state ready to merge back in
 */
function addFrame (windowState, tabs, frameOpts, newKey, partitionNumber, activeFrameKey, insertionIndex) {
  const frames = windowState.get('frames')
  const url = frameOpts.location || config.defaultUrl

  // delayedLoadUrl is used as a placeholder when the new frame is created
  // from a renderer initiated navigation (window.open, cmd/ctrl-click, etc...)
  const delayedLoadUrl = frameOpts.delayedLoadUrl
  delete frameOpts.delayedLoadUrl
  const urlBarFocused = activeFrameKey === newKey &&
    url === config.defaultUrl &&
    delayedLoadUrl === undefined
  const location = delayedLoadUrl || url // page url

  // Only add pin requests if it's not already added
  const isPinned = frameOpts.isPinned
  delete frameOpts.isPinned
  if (isPinned) {
    const alreadyPinnedFrameProps = frames.find((frame) =>
      frame.get('pinnedLocation') === location && frame.get('partitionNumber') === partitionNumber)
    if (alreadyPinnedFrameProps) {
      return {}
    }
  }

  // TODO: longer term get rid of parentFrameKey completely instead of
  // calculating it here.
  let parentFrameKey = frameOpts.parentFrameKey
  if (frameOpts.openerTabId) {
    parentFrameKey = getFrameKeyByTabId(windowState, frameOpts.openerTabId)
  }

  const frame = Immutable.fromJS(Object.assign({
    zoomLevel: config.zoom.defaultValue,
    audioMuted: false, // frame is muted
    location,
    aboutDetails: undefined,
    src: url, // what the iframe src should be
    tabId: -1,
    // if this is a delayed load then go ahead and start the loading indicator
    loading: !!delayedLoadUrl,
    startLoadTime: delayedLoadUrl ? new Date().getTime() : null,
    endLoadTime: null,
    lastAccessedTime: (activeFrameKey === newKey) ? new Date().getTime() : null,
    isPrivate: false,
    partitionNumber,
    pinnedLocation: isPinned ? url : undefined,
    key: newKey,
    navbar: {
      urlbar: {
        location: url,
        suggestions: {
          selectedIndex: 0,
          searchResults: [],
          suggestionList: null
        },
        selected: urlBarFocused,
        focused: urlBarFocused,
        active: false
      }
    },
    searchDetail: null,
    findDetail: {
      searchString: '',
      caseSensitivity: false
    },
    security: {
      isSecure: urlParse(url).protocol === 'https:',
      certDetails: null
    },
    unloaded: frameOpts.unloaded,
    parentFrameKey,
    history: []
  }, frameOpts))

  return {
    tabs: tabs.splice(insertionIndex, 0, tabFromFrame(frame)),
    frames: frames.splice(insertionIndex, 0, frame),
    activeFrameKey
  }
}

/**
 * Undoes a frame close and inserts it at the last index
 * @return Immutable top level application state ready to merge back in
 */
function undoCloseFrame (windowState, closedFrames) {
  if (closedFrames.size === 0) {
    return {}
  }
  const closedFrame = closedFrames.last()
  const insertIndex = closedFrame.get('closedAtIndex')
  return {
    closedFrames: closedFrames.pop(),
    tabs: windowState.get('tabs').splice(insertIndex, 0, tabFromFrame(closedFrame)),
    frames: windowState.get('frames').splice(insertIndex, 0,
          closedFrame
          .delete('guestInstanceId')
          .set('src', closedFrame.get('location'))),
    activeFrameKey: closedFrame.get('key')
  }
}

/**
 * Removes a frame specified by frameProps
 * @return Immutable top level application state ready to merge back in
 */
function removeFrame (frames, tabs, closedFrames, frameProps, activeFrameKey, framePropsIndex, closeAction) {
  function getNewActiveFrame (activeFrameIndex) {
    // Go to the next frame if it exists.
    let index = activeFrameIndex
    let nextFrame = newFrames.get(index)
    do {
      if (nextFrame) {
        if (nextFrame.get('pinnedLocation') === undefined) {
          return nextFrame.get('key')
        }
        nextFrame = newFrames.get(++index)
      }
    } while (nextFrame)
    // Otherwise go to the frame right before the active tab.
    index = activeFrameIndex
    while (index > 0) {
      const prevFrame = newFrames.get(--index)
      if (prevFrame && prevFrame.get('pinnedLocation') === undefined) {
        return prevFrame.get('key')
      }
    }
    // Fall back on the original logic.
    return Math.max(
      newFrames.get(activeFrameIndex)
      ? newFrames.get(activeFrameIndex).get('key')
      : newFrames.get(activeFrameIndex - 1).get('key'),
    0)
  }

  if (!frameProps.get('isPrivate') && frameProps.get('location') !== 'about:newtab') {
    frameProps = frameProps.set('isFullScreen', false)
    closedFrames = closedFrames.push(frameProps)
    if (frameProps.get('thumbnailBlob')) {
      window.URL.revokeObjectURL(frameProps.get('thumbnailBlob'))
    }
    if (closedFrames.size > config.maxClosedFrames) {
      closedFrames = closedFrames.shift()
    }
  }

  const newFrames = frames.splice(framePropsIndex, 1)
  const newTabs = tabs.splice(framePropsIndex, 1)
  let newActiveFrameKey = activeFrameKey

  // If the frame being removed IS ACTIVE
  let isActiveFrameBeingRemoved = frameProps.get('key') === activeFrameKey
  if (isActiveFrameBeingRemoved && newFrames.size > 0) {
    let activeFrameIndex

    switch (closeAction) {
      case tabCloseAction.LAST_ACTIVE:
        const lastActive = getFrameByLastAccessedTime(newFrames)
        activeFrameIndex = (lastActive > -1) ? lastActive : frames.count() - 1
        break
      case tabCloseAction.NEXT:
        activeFrameIndex = ((frames.count() - 1) === framePropsIndex) ? (framePropsIndex - 1) : framePropsIndex
        break
      // Default is a parent tab
      default:
        let parentFrameIndex = findIndexForFrameKey(frames, frameProps.get('parentFrameKey'))
        activeFrameIndex = (parentFrameIndex === -1) ? findIndexForFrameKey(frames, activeFrameKey) : parentFrameIndex
        break
    }

    // let's find new active NON-PINNED frame.
    newActiveFrameKey = getNewActiveFrame(activeFrameIndex)
  }

  return {
    previewFrameKey: null,
    activeFrameKey: newActiveFrameKey,
    closedFrames,
    tabs: newTabs,
    frames: newFrames
  }
}

/**
 * Removes all but the specified frameProps
 * @return Immutable top level application state ready to merge back in
 */
function removeOtherFrames (frames, tabs, closedFrames, frameProps) {
  closedFrames = closedFrames.concat(frames.filter((currentFrameProps) => !currentFrameProps.get('isPrivate') && currentFrameProps.get('key') !== frameProps.get('key')))
    .take(config.maxClosedFrames)
  closedFrames.forEach((currentFrameProps) => {
    if (currentFrameProps.get('thumbnailBlob')) {
      window.URL.revokeObjectURL(currentFrameProps.get('thumbnailBlob'))
    }
  })

  frames = Immutable.fromJS([frameProps])
  tabs = tabFromFrame(frames.get(0))
  return {
    activeFrameKey: frameProps.get('key'),
    closedFrames,
    tabs,
    frames
  }
}

function getFrameTabPageIndex (frames, frameProps, tabsPerTabPage) {
  const index = getFramePropsIndex(frames, frameProps)
  if (index === -1) {
    return -1
  }
  return Math.floor(index / tabsPerTabPage)
}

const frameStatePath = (windowState, key) =>
  ['frames', findIndexForFrameKey(windowState.get('frames'), key)]

const activeFrameStatePath = (windowState) => frameStatePath(windowState, windowState.get('activeFrameKey'))

const frameStatePathForFrame = (windowState, frameProps) =>
  ['frames', getFramePropsIndex(windowState.get('frames'), frameProps)]

const tabStatePath = (windowState, frameKey) =>
  ['tabs', findIndexForFrameKey(windowState.get('frames'), frameKey)]

const tabStatePathForFrame = (windowState, frameProps) =>
  ['tabs', getFramePropsIndex(windowState.get('frames'), frameProps)]

module.exports = {
  query,
  find,
  isAncestorFrameKey,
  isFrameKeyActive,
  isFrameKeyPinned,
  getNonPinnedFrameCount,
  isPrivatePartition,
  isSessionPartition,
  getFrameIndex,
  getFrameDisplayIndex,
  getActiveFrameIndex,
  getActiveFrameDisplayIndex,
  getActiveFrameTabId,
  getFrameByIndex,
  getFrameByDisplayIndex,
  getFrameByKey,
  getFrameByTabId,
  getPartitionNumber,
  getActiveFrame,
  setActiveFrameDisplayIndex,
  setActiveFrameIndex,
  setActiveFrameKey,
  makeNextFrameActive,
  makePrevFrameActive,
  getFramePropValue,
  getFramePropPath,
  findIndexForFrameKey,
  findDisplayIndexForFrameKey,
  getFramePropsIndex,
  getFrameKeysByDisplayIndex,
  getPartition,
  getPartitionFromNumber,
  addFrame,
  undoCloseFrame,
  removeFrame,
  removeOtherFrames,
  tabFromFrame,
  frameOptsFromFrame,
  getFrameKeyByTabId,
  getFrameTabPageIndex,
  frameStatePath,
  activeFrameStatePath,
  frameStatePathForFrame,
  tabStatePath,
  tabStatePathForFrame
}
