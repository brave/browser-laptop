/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const config = require('../constants/config')
const urlParse = require('url').parse

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
  console.log(partition)
  const regex = /partition-(\d+)/
  const matches = regex.exec(partition)
  return matches && matches[0]
}

function isPrivatePartition (partition) {
  return partition && !partition.startsWith('persist:')
}

function isSessionPartition (partition) {
  return partition && partition.startsWith('persist:partition-')
}

function getPartition (frameOpts) {
  let partition = 'persist:default'
  if (frameOpts.get('isPrivate')) {
    partition = 'default'
  } else if (frameOpts.get('partitionNumber')) {
    partition = `persist:partition-${frameOpts.get('partitionNumber')}`
  }
  return partition
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
    canGoBack: false,
    canGoForward: false,
    location,
    aboutDetails: undefined,
    src: url, // what the iframe src should be
    tabId: -1,
    // if this is a delayed load then go ahead and start the loading indicator
    loading: !!delayedLoadUrl,
    startLoadTime: delayedLoadUrl ? new Date().getTime() : null,
    endLoadTime: null,
    isPrivate: false,
    partitionNumber,
    pinnedLocation: isPinned ? url : undefined,
    key: newKey,
    navbar: {
      urlbar: {
        location: url,
        urlPreview: '',
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
function removeFrame (frames, tabs, closedFrames, frameProps, activeFrameKey) {
  function getNewActiveFrame (activeFrameIndex) {
    // Go to the next frame if it exists.
    let index = activeFrameIndex
    let nextFrame = frames.get(index)
    do {
      if (nextFrame) {
        if (nextFrame.get('pinnedLocation') === undefined) {
          return nextFrame.get('key')
        }
        nextFrame = frames.get(++index)
      }
    } while (nextFrame)
    // Otherwise go to the frame right before the active tab.
    index = activeFrameIndex
    while (index > 0) {
      const prevFrame = frames.get(--index)
      if (prevFrame && prevFrame.get('pinnedLocation') === undefined) {
        return prevFrame.get('key')
      }
    }
    // Fall back on the original logic.
    return Math.max(
      frames.get(activeFrameIndex)
      ? frames.get(activeFrameIndex).get('key')
      : frames.get(activeFrameIndex - 1).get('key'),
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

  // If the frame being removed IS ACTIVE, then try to replace activeFrameKey with parentFrameKey
  let isActiveFrameBeingRemoved = frameProps.get('key') === activeFrameKey
  let parentFrameIndex = findIndexForFrameKey(frames, frameProps.get('parentFrameKey'))
  let activeFrameIndex

  if (!isActiveFrameBeingRemoved || parentFrameIndex === -1) {
    activeFrameIndex = findIndexForFrameKey(frames, activeFrameKey)
  } else {
    activeFrameIndex = parentFrameIndex
  }

  const framePropsIndex = getFramePropsIndex(frames, frameProps)
  frames = frames.splice(framePropsIndex, 1)
  tabs = tabs.splice(framePropsIndex, 1)

  let newActiveFrameKey = activeFrameKey
  if (isActiveFrameBeingRemoved && frames.size > 0) {
    // Frame with focus was closed; let's find new active NON-PINNED frame.
    newActiveFrameKey = getNewActiveFrame(activeFrameIndex)
  }

  return {
    previewFrameKey: null,
    activeFrameKey: newActiveFrameKey,
    closedFrames,
    tabs,
    frames
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

module.exports = {
  query,
  find,
  isAncestorFrameKey,
  isFrameKeyActive,
  isFrameKeyPinned,
  isPrivatePartition,
  isSessionPartition,
  getFrameIndex,
  getFrameDisplayIndex,
  getActiveFrameIndex,
  getActiveFrameDisplayIndex,
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
  addFrame,
  undoCloseFrame,
  removeFrame,
  removeOtherFrames,
  tabFromFrame,
  getFrameKeyByTabId,
  getFrameTabPageIndex
}
